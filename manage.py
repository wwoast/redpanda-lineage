#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import configparser
import datetime
import json
import os
import sys

from shared import PANDA_PATH, ZOO_PATH

def find_next_photo_index(panda_file, start_point, stop_point):
    """
    Given we deleted pandas from a dataset entry, find the next available photo
    to move to the first available spot.
    """
    photo_index = start_point
    panda = configparser.ConfigParser()
    panda.read(panda_file)
    photo_option = "photo." + start_point
    while panda.has_option("panda", photo_option) == False:
        photo_index = photo_index + 1
        photo_option = "photo." + photo_index
        # If start point went beyond the last photo, return zero
        if photo_index > stop_point:
            return 0
    return start_point

def renumber_panda_photos(panda_file, stop_point):
    """
    Given a file that's just had photos removed from it, renumber all the
    remaining photos so that there are no gaps.
    """
    start_index = 1
    photo_index = start_index
    panda = configparser.ConfigParser()
    panda.read(panda_file)
    while photo_index <= stop_point:
        # If a photo doesn't exist, find the next photo that exists and swap its value
        photo_option = "photo." + photo_index
        photo_author = photo_option + ".author"
        photo_link = photo_option + ".link"
        if panda.has_option("panda", photo_option) == False:
            next_index = find_next_photo_index(panda_file, photo_index, stop_point)
            if next_index > 0:
                next_option = "photo." + next_index
                next_author = next_option + ".author"
                next_link = next_option + ".link"
                panda.set("panda", photo_option, panda.get("panda", next_option))
                panda.set("panda", photo_author, panda.get("panda", next_author))
                panda.set("panda", photo_link, panda.get("panda", next_link))
                panda.remove_option("panda", next_option)
                panda.remove_option("panda", next_section)
                panda.remove_option("panda", next_link)
            else:
                # We're done processing photos if there are none to renumber
                break
        photo_index = photo_index + 1

def remove_panda_photos(author):
    """
    Occasionally users will remove or rename their photo files online.
    For cases where the original files cannot be recovered, it may be
    simpler to remove photos by an author and add them back later.

    Given a author (typically an Instagram username), remove their photos
    from every panda or zoo data entry.
    """
    start_index = 1
    photo_index = start_index
    panda = configparser.ConfigParser()
    # Enter the pandas subdirectories
    for root, dirs, files in os.walk(PANDA_PATH):
        for filename in files:
            panda.read(filename)
            photo_option = "photo." + photo_index 
            author_option = photo_option + ".author"
            author_link = photo_option + ".link"
            # Look at all available photo fields for a panda, until we get to
            # the Nth photo that doesn't exist 
            while panda.has_option("panda", author_option):
                panda_author = panda.get("panda", "photo." + photo_index + ".author")
                if author == panda_author:
                    panda.remove_option("panda", photo_option)
                    panda.remove_option("panda", author_option)
                    panda.remove_option("panda", author_link)
                photo_index = photo_index + 1
                photo_option = "photo." + photo_index 
                author_option = photo_option + ".author"
                author_link = photo_option + ".link"
            # Done removing photos? Renumber the ones that are still there
            renumber_panda_photos(filename, photo_index)

def remove_zoo_photos(author):
    """
    Zoos only have a single photo recorded for each one.
    """
    zoo = configparser.ConfigParser()
    # Enter the zoo subdirectories
    for root, dirs, files in os.walk(ZOO_PATH):
        for filename in files:
            zoo.read(filename)
            zoo_author = zoo.get("zoo", "photo.author")
            if zoo_author == author:
                zoo.remove_option("zoo", "photo") 
                zoo.remove_option("zoo", "photo.author") 
                zoo.remove_option("zoo", "photo.link") 

if __name__ == '__main__':
    """Choose a utility funciton."""
    if len(sys.argv) == 3:
        if sys.argv[1] == "--remove-photos":
            remove_panda_photos(sys.argv[2])
            remove_zoo_photos(sys.argv[2])
