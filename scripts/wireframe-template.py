#!/usr/bin/env python3
"""
ASCII Wireframe Template

Copy this file and edit the 'lines' array to create your wireframe.

Usage:
    cp scripts/wireframe-template.py /tmp/my-wireframe.py
    # Edit /tmp/my-wireframe.py
    python3 /tmp/my-wireframe.py
"""

WIDTH = 58  # Content width

# Edit these lines to create your wireframe
lines = [
    "  Your content here",
    "",
    "  Section 2",
    "",
]

# ============================================================
# DO NOT EDIT BELOW THIS LINE
# ============================================================

def generate_wireframe(lines, width):
    """Generate ASCII wireframe with perfect alignment."""
    border = "+" + "-" * width + "+"
    output = [border]

    for line in lines:
        padded = line.ljust(width)
        output.append("|" + padded + "|")

    output.append(border)
    return "\n".join(output)

if __name__ == "__main__":
    wireframe = generate_wireframe(lines, WIDTH)
    print(wireframe)
