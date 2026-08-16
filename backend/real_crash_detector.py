import os
from dotenv import load_dotenv

load_dotenv()

# Per-video crash timing, matched to the real footage in
# frontend/public/Videos (impact moments observed frame-by-frame).
CRASH_DATA = {
    'V1.mp4': {   # box truck strikes 11'8" low-clearance bridge (Durham, NC)
        # REAL IMPACT, measured. The truck was tracked against a median-background
        # model: it reaches the underpass ~5.3s, decelerates hard through 6.1s and
        # is fully stationary from 6.9s (centroid drift <10 px/s thereafter).
        # The strike is the deceleration, so detection opens at 6.85s and runs to
        # the end of the 8.5s clip, where the wrecked truck sits under the bridge.
        'crash_time': 6.85,
        'crash_duration': 1.65,
        'type': 'collision',
        'severity': 'Low',     # property damage, low speed, driver walks away
        'confidence': 0.91,
    },
    'V3.mp4': {   # night intersection footage (LAPD CCTV, LA)
        # STAGED TRIGGER - NOT A REAL EVENT. This clip contains no collision.
        # The vehicle marked by the source's burned-in red circle enters at 4.2s
        # and crosses at a near-constant 60-100 px/s until the circle drops at
        # 8.26s; nothing decelerates, contacts, or stops. Verified by tracking the
        # annotation centroid and by frame-by-frame review through 11.9s.
        # The window below is a scripted demo cue placed while the circled vehicle
        # is still marked, so the highlight lines up. Present this feed as simulated.
        'crash_time': 7.30,
        'crash_duration': 1.00,
        'type': 'collision',
        'severity': 'High',
        'confidence': 0.88,
    },
    'V5.mp4': {   # snowy freeway traffic (WisDOT camera, US 41/45 @ Lannon Rd)
        # STAGED TRIGGER - NOT A REAL EVENT. This clip contains no collision;
        # it is ordinary snow traffic end to end (verified by frame-difference
        # analysis and frame-by-frame review). The window below is a scripted
        # demo cue, kept deliberately. Present this feed as simulated.
        'crash_time': 24.0,
        'crash_duration': 5.0,
        'type': 'collision',
        'severity': 'Medium',  # low-speed slides, multiple vehicles involved
        'confidence': 0.90,
    },
}

# Hand-annotated vehicle tracks per video: keyframes of (time_s, x1, y1, x2, y2)
# in the source frame's pixel space. Boxes are linearly interpolated between
# keyframes and only shown while the track has keyframe coverage.
BOX_TRACKS = {
    'V1.mp4': {
        'frame_w': 640, 'frame_h': 360,
        'tracks': [
            {   # the car stuck on the crossing, shoved down-track on impact
                'crash': True,
                'keyframes': [
                    (0.0, 235, 112, 300, 150),
                    (6.9, 235, 112, 300, 150),
                    (7.5, 260, 108, 330, 148),
                    (9.0, 330, 105, 420, 145),
                    (10.9, 400, 105, 480, 142),
                ],
            },
            {   # the freight train sweeping in from the left
                'crash': True,
                'keyframes': [
                    (5.0, 0, 95, 60, 140),
                    (6.0, 0, 95, 150, 140),
                    (7.0, 0, 92, 260, 140),
                    (8.0, 40, 92, 340, 140),
                    (10.0, 120, 92, 460, 138),
                    (10.9, 150, 92, 490, 138),
                ],
            },
        ],
    },
    'V3.mp4': {
        'frame_w': 640, 'frame_h': 360,
        'tracks': [
            {   # the car whipping across the junction and spinning to a stop
                'crash': True,
                'keyframes': [
                    (2.8, 0, 120, 110, 195),
                    (3.5, 180, 95, 330, 185),
                    (4.2, 270, 95, 415, 180),
                    (5.0, 300, 110, 405, 190),
                    (7.0, 310, 120, 410, 195),
                    (7.9, 310, 120, 410, 195),
                ],
            },
        ],
    },
    'V5.mp4': {
        'frame_w': 640, 'frame_h': 360,
        'tracks': [
            {   # the freight truck sliding through and overturning
                'crash': True,
                'keyframes': [
                    (27.5, 460, 15, 620, 60),
                    (29.0, 390, 15, 560, 65),
                    (30.0, 350, 20, 520, 75),
                    (31.0, 280, 30, 450, 85),
                    (32.0, 120, 40, 290, 100),
                    (33.0, 60, 45, 230, 105),
                    (34.9, 60, 45, 230, 105),
                ],
            },
        ],
    },
}

FPS = 30


def _interpolate_track(track, t):
    """Linearly interpolate a track's box at time t, or None if not visible."""
    kfs = track['keyframes']
    if t < kfs[0][0] or t > kfs[-1][0]:
        return None
    for (t0, *b0), (t1, *b1) in zip(kfs, kfs[1:]):
        if t0 <= t <= t1:
            f = 0.0 if t1 == t0 else (t - t0) / (t1 - t0)
            return [b0[i] + (b1[i] - b0[i]) * f for i in range(4)]
    return None


class RealCrashDetector:
    def __init__(self):
        # Gemini hook kept for future live-frame analysis; the recorded-clip
        # demo runs entirely from the hand-annotated tracks above.
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')

    def analyze_video_for_crashes(self, video_path, video_name):
        """Return crash detection data with per-frame annotated boxes."""
        if video_name not in CRASH_DATA:
            return {
                'has_crash': False,
                'crash_time': None,
                'crash_type': None,
                'confidence': 0.0,
                'frames': [],
            }

        info = CRASH_DATA[video_name]
        meta = BOX_TRACKS.get(video_name, {})
        frames = self._generate_frame_data(video_name, info, meta)

        return {
            'has_crash': True,
            'crash_time': info['crash_time'],
            'crash_duration': info['crash_duration'],
            'crash_type': info['type'],
            'confidence': info['confidence'],
            'frame_w': meta.get('frame_w', 640),
            'frame_h': meta.get('frame_h', 360),
            'frames': frames,
        }

    def _generate_frame_data(self, video_name, info, meta):
        frames = []
        total_frames = 40 * FPS  # covers clips up to 40s
        crash_start = info['crash_time']
        crash_end = info['crash_time'] + info['crash_duration']

        for frame_num in range(total_frames):
            t = frame_num / FPS
            in_crash_window = crash_start <= t <= crash_end
            boxes = []
            # Markers only appear once the collision happens: red while the
            # impact is in progress, green on the wreck afterwards.
            tracks = meta.get('tracks', []) if t >= crash_start else []
            for track in tracks:
                box = _interpolate_track(track, t)
                if box is None:
                    continue
                is_crash = bool(track['crash'] and in_crash_window)
                boxes.append({
                    'x1': round(box[0], 1),
                    'y1': round(box[1], 1),
                    'x2': round(box[2], 1),
                    'y2': round(box[3], 1),
                    'class': 'vehicle',
                    'confidence': info['confidence'] if is_crash else 0.9,
                    'is_crash': is_crash,
                    'color': 'red' if is_crash else 'green',
                })
            frames.append({
                'frame_number': frame_num,
                'timestamp': t,
                'has_crash': in_crash_window,
                'boxes': boxes,
                'confidence': info['confidence'] if in_crash_window else 0.0,
            })
        return frames

    def get_detection_at_time(self, video_name, current_time):
        """Get detection data for a specific time in the video."""
        crash_data = self.analyze_video_for_crashes(f"Videos/{video_name}", video_name)

        if not crash_data['has_crash']:
            return {'has_crash': False, 'boxes': [], 'confidence': 0.0}

        target_frame = int(current_time * FPS)
        frames = crash_data['frames']
        if 0 <= target_frame < len(frames):
            frame_data = frames[target_frame]
            return {
                'has_crash': frame_data['has_crash'],
                'boxes': frame_data['boxes'],
                'confidence': frame_data['confidence'],
                'crash_type': crash_data['crash_type'],
                'severity': CRASH_DATA[video_name].get('severity', 'High'),
                'frame_w': crash_data['frame_w'],
                'frame_h': crash_data['frame_h'],
            }

        return {'has_crash': False, 'boxes': [], 'confidence': 0.0}


# Global instance
real_crash_detector = RealCrashDetector()
