from manim import *
from manim import typing
import numpy as np
import random
import math

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
        src, src_text = rect_with_text(1, 1, "src")
        self.play(Create(src), Write(src_text))
        container = VGroup()
        for _ in range(3):
            transparent = hollow_rect_with_text(1, 1)
            container.add(transparent)
        container.arrange(RIGHT)
        container.next_to(src, RIGHT)
        self.play(Create(container))


def compute_position_embedding_matrix(dimension: int, max_sequence_length: int):
    pos = np.arange(max_sequence_length)[:, None]
    i = np.arange(dimension)[None, :]
    angle_rates = 1 / np.power(10000, (2 * (i // 2)) / np.float32(dimension))
    return pos * angle_rates


def get_positional_embedding(matrix: np.ndarray, dimension: int, position: int):
    if dimension % 2 == 0:
        return np.sin(matrix[position, dimension])
    return np.cos(matrix[position, dimension])

    

class PositionalEmbedding(Scene):
    
    def construct(self):
        dimensions = 128
        nof_positions = 60
        x_length = 10
        y_length = 6
        position_embedding_matrix = compute_position_embedding_matrix(dimensions, nof_positions)

        grid = Axes(
            x_range=[0, dimensions, 10],
            y_range=[0, nof_positions, 10],
            x_length=x_length,
            y_length=y_length,
            axis_config={
                "color": BLUE,  
                "include_tip": False,
                "include_numbers": True,
                "tick_size": 0,
                "font_size": 20,
            }
        )
        
        label_scaling = 0.55
        y_label = grid.get_y_axis_label("position", edge=LEFT, direction=LEFT, buff=0.4).scale(label_scaling)
        x_label = grid.get_x_axis_label("dimension").scale(label_scaling)
        grid_labels = VGroup(x_label, y_label)
        
        self.play(Write(grid), run_time=1)
        self.play(Write(grid_labels), run_time=0.5)

        rect_height = y_length / nof_positions
        rect_width = x_length / dimensions
        
        rectangles = VGroup()
        for position in range(nof_positions):
            row = VGroup()
            for dim in range(dimensions):
                embedding = get_positional_embedding(position_embedding_matrix, dim, position)

                fill_color = BLUE if embedding > 0 else RED
                rectangle = Rectangle(
                    height=rect_height,
                    width=rect_width,
                    stroke_width=0
                )
                rectangle.set_fill(color=fill_color, opacity=abs(embedding))

                if dim == 0:
                    row.add(rectangle)
                else:
                    rectangle.next_to(row[-1], RIGHT, buff=0)
                    row.add(rectangle)
            if position == 0:
                rectangles.add(row)
            else:
                row.next_to(rectangles[-1], UP, buff=0)
                rectangles.add(row)
        
        x_axis = grid.get_x_axis()
        y_axis = grid.get_y_axis()
        rectangles.next_to(x_axis, aligned_edge=DOWN, buff=0)
        rectangles.next_to(y_axis, aligned_edge=LEFT, buff=0.25)
        rectangles.shift(0.03*DOWN)
        rectangles.shift(0.03*LEFT)
        self.play(Write(rectangles))

