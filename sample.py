#!/usr/bin/python3

# Tools for making subsets / samples of Red Panda Lineage data

import os
import sys

from shared import MEDIA_PATH, PANDA_PATH, ZOO_PATH, SpeciesError, PhotoFile, SectionNameError, get_max_entity_count

def sample_photos(animals, photos, size, species, taglist):
    """
    Get a sample of the Red Panda Lineage project's linked photos.
    This was written to support a facial recognition study for red pandas.

    Structure of the output:
    ./sample-<utime>: output folder
    ./sample/info.txt: Record and summary of the queried photo data
        - RPF Git commit, sample.py command ran (including animal and photo counts) 
    ./sample/a.f.fulgens OR ./sample/a.f.styani:
        - Sample data arranged by subspecies
    ./sample/<species>/images/<rpf-id>_photo.<photo.index>.jpg
    ./sample/<species>/metadata/<rpf-id>_photo.<photo.index>.txt
        - photo.url, author, commitdate, link, tags, uncertainty
    """
    max = int(get_max_entity_count())
    for file_path in [PANDA_PATH]:
        section = None
        for section_name in ["pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                # print(path)
                photo_list = PhotoFile(section, path)
                photo_count = photo_list.photo_count()
                # TOWRITE: check_species
                photo_index = 1
                # TOWRITE: has_tag in PhotoFile
                # TOWRITE: get_sample method, considers size and counts
                pass

if __name__ == '__main__':
    # Default settings
    animals = 100
    photos = 5
    size = "m"
    taglist = "close-up, profile, portrait"
    # Parse arguments
    if (sys.argv.index("animals") != -1):
        animals = int(sys.argv[sys.argv.index("animals") + 1])
    if (sys.argv.index("photos") != -1):
        photos = int(sys.argv[sys.argv.index("photos") + 1])
    if (sys.argv.index("size") != -1):
        size = int(sys.argv[sys.argv.index("size") + 1])
        if ((size != "t") and (size != "m") and (size != "l")):
            raise SizeError("%s photo size is not one of: t m l" % size)
    if (sys.argv.index("species") != -1):
        species = int(sys.argv[sys.argv.index("species") + 1])
        if ((species < 1) or (species > 2)):
            raise SpeciesError("%s species value not 1 or 2 (1: fulgens, 2: styani)" % species)
    if (sys.argv.index("taglist") != -1):
        taglist = sys.argv[sys.argv.index("taglist") + 1]
    taglist = taglist.split(", ")
    # Build a sample 
    sample_photos(animals, photos, size, species, taglist)


