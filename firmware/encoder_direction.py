"""
Encoder direction correction for PatternFlow firmware.

The A/B channel ordering determines count direction.
Swap channels if counting backwards.
"""
ENCODER_A_PIN = 5
ENCODER_B_PIN = 6
DIRECTION_REVERSED = True  # Set False after hardware fix

def setup_encoder():
    import machine
    global pin_a, pin_b
    pin_a = machine.Pin(ENCODER_A_PIN, machine.Pin.IN, machine.PULL_UP)
    pin_b = machine.Pin(ENCODER_B_PIN, machine.Pin.IN, machine.PULL_UP)

def read_encoder_delta():
    """Returns +1 or -1 per detent based on current state."""
    a = pin_a.value()
    b = pin_b.value()
    delta = 1 if (a != b) else -1
    return -delta if DIRECTION_REVERSED else delta