# Overhead Mining Game

import random
import curses

MAP_WIDTH = 20
MAP_HEIGHT = 10

PLAYER = '@'
ORE = 'O'
WALL = '#'
EMPTY = '.'

NUM_ORE = 10


def create_map():
    game_map = [[EMPTY for _ in range(MAP_WIDTH)] for _ in range(MAP_HEIGHT)]
    for x in range(MAP_WIDTH):
        game_map[0][x] = WALL
        game_map[MAP_HEIGHT - 1][x] = WALL
    for y in range(MAP_HEIGHT):
        game_map[y][0] = WALL
        game_map[y][MAP_WIDTH - 1] = WALL
    placed = 0
    while placed < NUM_ORE:
        x = random.randint(1, MAP_WIDTH - 2)
        y = random.randint(1, MAP_HEIGHT - 2)
        if game_map[y][x] == EMPTY:
            game_map[y][x] = ORE
            placed += 1
    return game_map


def draw_map(stdscr, game_map, player_pos):
    stdscr.clear()
    for y in range(MAP_HEIGHT):
        row = ''
        for x in range(MAP_WIDTH):
            if (x, y) == player_pos:
                row += PLAYER
            else:
                row += game_map[y][x]
        stdscr.addstr(y, 0, row)
    stdscr.refresh()


def move_player(key, player_pos, game_map):
    x, y = player_pos
    if key == curses.KEY_UP:
        new_pos = (x, y - 1)
    elif key == curses.KEY_DOWN:
        new_pos = (x, y + 1)
    elif key == curses.KEY_LEFT:
        new_pos = (x - 1, y)
    elif key == curses.KEY_RIGHT:
        new_pos = (x + 1, y)
    else:
        return player_pos
    nx, ny = new_pos
    if game_map[ny][nx] != WALL:
        if game_map[ny][nx] == ORE:
            game_map[ny][nx] = EMPTY
        return new_pos
    return player_pos


def main(stdscr):
    curses.curs_set(0)
    game_map = create_map()
    player_pos = (MAP_WIDTH // 2, MAP_HEIGHT // 2)
    draw_map(stdscr, game_map, player_pos)
    while True:
        key = stdscr.getch()
        if key == ord('q'):
            break
        player_pos = move_player(key, player_pos, game_map)
        draw_map(stdscr, game_map, player_pos)


if __name__ == '__main__':
    curses.wrapper(main)
