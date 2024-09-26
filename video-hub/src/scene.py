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

    

class HeatmapExample(Scene):
    
    def construct(self):
        dimensions = 128
        nof_positions = 50
        x_length = 10
        y_length = 6
        position_embedding_matrix = compute_position_embedding_matrix(dimensions, nof_positions)

        ax = Axes(
            x_range=[0, dimensions, 10],
            y_range=[0, nof_positions, 10],
            x_length=x_length,
            y_length=y_length,
            axis_config={
                "color": BLUE,  
                "include_tip": False,
                "include_numbers": True,
                "tick_size": 0,
            }
        )

        self.play(Write(ax), run_time=1)

        rect_height = x_length / dimensions
        rect_width = y_length / nof_positions
        
        rectangles = VGroup()
        for dim in range(dimensions):
            row = VGroup()
            for position in range(nof_positions):
                embedding = get_positional_embedding(position_embedding_matrix, dim, position)

                fill_color = BLUE if embedding > 0 else RED
                rectangle = Rectangle(
                    height=rect_height,
                    width=rect_width,
                    fill_color=fill_color,
                    fill_opacity=abs(embedding),
                    stroke_width=0
                )
                # Move the bottom left corner to x y, not the center
                rectangle.move_to(ax.coords_to_point(dim, position) + np.array([rect_width/2, rect_height/2, 0]))
                rectangles.add(rectangle)

                row.add(rectangle)
            rectangles.add(row)

        self.play(Write(rectangles), run_time=1)


class Test(Scene):
    
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

        y_label = grid.get_y_axis_label("pos", edge=LEFT, direction=LEFT, buff=0.4)
        x_label = grid.get_x_axis_label("dimension")
        grid_labels = VGroup(x_label, y_label)
        
        self.play(Write(grid), run_time=1)
        self.play(Write(grid_labels), run_time=0.5)

        rectangles = VGroup()
        rect = Rectangle(height=1, width=1, stroke_width=0)
        rect2 = Rectangle(height=1, width=1, stroke_width=0)
        rect3 = Rectangle(height=1, width=1, stroke_width=0)
        rect.set_fill(color=BLUE, opacity=0.5)
        rect2.set_fill(color=RED, opacity=0.5)
        rect3.set_fill(color=GREEN, opacity=0.5)
        rect2.next_to(rect, RIGHT, buff=0)
        rect3.next_to(rect, UP, buff=0)
        rectangles.add(rect, rect2, rect3)
        print(f"Grid coords: {grid.coords_to_point(*rect.get_center())}")
        print(f"Rect coords: {rect.get_center()}")
        rectangles.next_to(grid.coords_to_point(*rectangles.get_center()), aligned_edge=DL, buff=0)
        self.play(Write(rectangles))
        self.wait(1)

        # rect_height = x_length / dimensions
        # rect_width = y_length / nof_positions
        
        # rectangles = VGroup()
        # for dim in range(dimensions):
        #     row = VGroup()
        #     for position in range(nof_positions):
        #         embedding = get_positional_embedding(position_embedding_matrix, dim, position)

        #         fill_color = BLUE if embedding > 0 else RED
        #         rectangle = Rectangle(
        #             height=rect_height,
        #             width=rect_width,
        #             fill_color=fill_color,
        #             fill_opacity=abs(embedding),
        #             stroke_width=0
        #         )
        #         # Move the bottom left corner to x y, not the center
        #         rectangle.move_to(ax.coords_to_point(dim, position) + np.array([rect_width/2, rect_height/2, 0]))
        #         rectangles.add(rectangle)

        #         row.add(rectangle)
        #     rectangles.add(row)

        # self.play(Write(rectangles), run_time=1)

