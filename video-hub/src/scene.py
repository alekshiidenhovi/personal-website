from manim import *
from manim import typing

def rect_with_text(height: int, width: int, text: str):
    rectangle = Rectangle(
        height=height, 
        width=width, 
        stroke_color=BLACK
    )
    rectangle.set_fill(color=GRAY_C, opacity=0.6)
    text_snippet = Text(text)
    text_snippet.move_to(rectangle.get_center())
    return rectangle, text_snippet


def hollow_rect_with_text(height: int, width: int):
    rectangle = Rectangle(
        height=height, 
        width=width, 
        stroke_color=GRAY_B
    )
    rectangle.set_fill(color=GRAY_A, opacity=0.6)
    return rectangle


class MathematicalFramework(Scene):
    def construct(self):
        self.camera.background_color = WHITE
        src, src_text = rect_with_text(1, 1, "src")
        self.play(Create(src), Write(src_text))
        container = VGroup()
        for _ in range(3):
            transparent = hollow_rect_with_text(1, 1)
            container.add(transparent)
        container.arrange(RIGHT)
        container.next_to(src, RIGHT)
        self.play(Create(container))