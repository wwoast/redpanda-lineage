#!/usr/bin/python3

# Tools for making subsets / samples of Red Panda Lineage data

import os
import random
import sys

from shared import MEDIA_PATH, PANDA_PATH, ZOO_PATH, SpeciesError, PhotoEntry, PhotoFile, SectionNameError, get_max_entity_count

def define_photo_sample(num_animals, num_photos, size, species, taglist):
    """
    Get a sample of the Red Panda Lineage project's linked photos.
    This was written to support a facial recognition study for red pandas.
    """
    matched_photos = []
    output_photos = []
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
                # Ignore if it's not the species we want
                if (photo_list.get_field("species") not in species):
                    continue
                photo_index = 1
                while (photo_index <= photo_count):
                    current_tag = "photo." + str(photo_index) + ".tags"
                    # Only collect photos in the tag list
                    if photo_list.array_has_value(current_tag, taglist) == False:
                        photo_index = photo_index + 1
                        continue
                    # Collect photos
                    value = photo_list.get_field(current_tag)
                    raw = current_tag + ": " + value
                    photo = PhotoEntry(filename, raw)
                    matched_photos.append(photo)
    # Shuffle the list of photos that match our interest
    random.shuffle(matched_photos)
    # Take entire photo set we've gathered, and whittle it down to
    # the animal_count and photo_count set of photos.
    animal_id_list = []
    for photo in matched_photos:
        # Don't go over the photo count overall
        if len(output_photos) == num_photos:
            return photos
        if photo.entity_id not in animal_id_list:
            # Don't go over your animal count
            if len(animal_id_list) < num_animals:
                output_photos.append(photo)
                animal_id_list.append(photo.entity_id)
            else:
                continue
        else:
            # Animal id seen previously, and we still need photos
            output_photos.append(photo)
    return output_photos

def fetch_sample_photos(desired_photos):
    """
    Given a defined set of photos we selected from the dataset, grab them
    from the Internet, and write them in an organized way.

    Structure of the output:
    ./sample-<utime>: output folder 
    ./sample/a.f.fulgens OR ./sample/a.f.styani:
        - Sample data arranged by subspecies
    ./sample/<species>/images/<rpf-id>_photo.<photo.index>.jpg
    ./sample/<species>/metadata/<rpf-id>_photo.<photo.index>.txt
        - photo.url, author, commitdate, link, tags, uncertainty
    """
    pass

def write_sample_summary(desired_photos):
    """
    Write an informational summary of the sample, as well as all URLs gathered.
    
    Structure of the output:
    ./sample-<utime>: output folder
    ./sample/info.txt: Record and summary of the queried photo data
        - RPF Git commit, sample.py command ran (including animal and photo counts)
    """
    pass

if __name__ == '__main__':
    # Default settings
    animals = 100
    photos = 5
    size = "m"
    species = ["1", "2"]   # All Species
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
        species = [int(sys.argv[sys.argv.index("species") + 1])]
        if ((species < 1) or (species > 2)):
            raise SpeciesError("%s species value not 1 or 2 (1: fulgens, 2: styani)" % species)
    if (sys.argv.index("taglist") != -1):
        taglist = sys.argv[sys.argv.index("taglist") + 1]
    taglist = taglist.split(", ")
    # Build a sample 
    collect_photo_sample(animals, photos, size, species, taglist)
    # 


