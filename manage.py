#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import configparser
import datetime
import json
import os
import sys

from shared import *

def renumber_photos(data_file):
    """
    Given a file that's just had photos removed from it, renumber all the
    remaining photos so that there are no gaps.
    """
    pass

def remove_photos(author):
    """
    Occasionally users will remove or rename their photo files online.
    For cases where the original files cannot be recovered, it may be
    simpler to remove photos by an author and add them back later.

    Given a author (typically an Instagram username), remove their photos
    from every panda or zoo data entry.
    """
    # Enter the pandas and zoos subdirectories.
    # If photo.?.author matches author, remove all photo.?. values.
    # Then renumber the remaining contents
    pass

if __name__ == '__main__':
    """Choose a utility funciton."""
    if len(sys.argv) == 3:
        if sys.argv[1] == "--remove-photos":
            remove_photos(sys.argv[2])