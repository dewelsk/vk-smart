#!/usr/bin/env python3
"""
ASCII Wireframe Generator

Usage:
    python3 scripts/generate-wireframe.py

Edit the 'lines' array below to create your wireframe.
"""

# Configuration
WIDTH = 58  # Content width (adjust as needed)

# Add your lines here
lines = [
    "  [Header]                                  [User Menu]",
    "",
    "  Page Title",
    "  ==========",
    "",
    "  +---------------------+  +---------------------+",
    "  | Card 1              |  | Card 2              |",
    "  |                     |  |                     |",
    "  | Content here        |  | More content        |",
    "  +---------------------+  +---------------------+",
    "",
    "  Main content section",
    "  -------------------------------------------------",
    "",
    "  +------------------------------------------------+",
    "  | Item 1 | Description            | [Button]    |",
    "  | Item 2 | Another description    | [Button]    |",
    "  +------------------------------------------------+",
    "",
    "  [Footer info]                            [Actions]",
]

# Generate wireframe
def generate_wireframe(lines, width):
    """Generate ASCII wireframe with perfect alignment."""
    border = "+" + "-" * width + "+"

    output = [border]

    for line in lines:
        # Left-justify and pad to exact width
        padded = line.ljust(width)
        output.append("|" + padded + "|")

    output.append(border)

    return "\n".join(output)

# Main
if __name__ == "__main__":
    wireframe = generate_wireframe(lines, WIDTH)
    print(wireframe)

    # Optional: Save to file
    # with open('wireframe.txt', 'w') as f:
    #     f.write(wireframe)
    #     print("\n✅ Wireframe saved to wireframe.txt")
