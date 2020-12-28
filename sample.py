#!/usr/bin/python3

# Tools for making subsets / samples of Red Panda Lineage data

import os
import random
import sys

from shared import *

def collect_photo_uris(min_photos=0, species=["1", "2"], taglist=None):
    """
    Collect all photo uris in the dataset that match:
    - A minimum numbe rof photos for the animal
    - An array of possible species (defaults to ["1", "2"] which gets all)
    - A list of photo tags (defaults to getting photos regarless of tag)
    """
    matched_photos = []
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
                if photo_count == 0:
                    # Ignore if panda has no photos
                    continue
                if photo_count < min_photos:
                    # Ignore if this panda doesn't have enough photos
                    continue
                # Ignore if it's not the species we want
                if (photo_list.get_field("species") not in species):
                    continue
                photo_index = 1
                while (photo_index <= photo_count):
                    current_photo = "photo." + str(photo_index)
                    current_tag = "photo." + str(photo_index) + ".tags"
                    # If we have a taglist, only collect photos in the list
                    if taglist != None:
                        if photo_list.array_has_value(current_tag, taglist) == False:
                            photo_index = photo_index + 1
                            continue
                    # Collect photos
                    value = photo_list.get_field(current_photo)
                    raw = current_photo + ": " + value
                    photo = PhotoEntry(path, raw)
                    matched_photos.append(photo)
                    photo_index = photo_index + 1
    return matched_photos

def define_min_photo_sample(min_count=40, photos=40, species=["1", "2"]):
    """
    Fetch a sample of all animals that have at least N photos in the dataset.
    Defaults to 40 photos.
    """
    output_photos = []
    matched_photos = collect_photo_uris(min_count, species)
    # Shuffle the list of photos that match our interest
    random.shuffle(matched_photos)
    # Take entire photo set we've gathered, and whittle it down to
    # the animal_count and photo_count set of photos.
    animal_id_dict = {}
    for photo in matched_photos:
        # Count how many photos of each animal we've gone through
        if photo.entity_id not in animal_id_dict:
            animal_id_dict[photo.entity_id] = 1
        else:
            animal_id_dict[photo.entity_id] = animal_id_dict[photo.entity_id] + 1
        if animal_id_dict[photo.entity_id] > photos:
            # We have enough photos of this animal
            continue
        else:
            output_photos.append(photo)
    return output_photos

def define_random_tag_sample(num_animals, num_photos, species, taglist):
    """
    Fetch a random sample of the Red Panda Lineage project's linked photos.
    """
    output_photos = []
    matched_photos = collect_photo_uris(0, species, taglist)
    # Shuffle the list of photos that match our interest
    random.shuffle(matched_photos)
    # Take entire photo set we've gathered, and whittle it down to
    # the animal_count and photo_count set of photos.
    animal_id_list = []
    for photo in matched_photos:
        # Don't go over the photo count overall
        if len(output_photos) == num_photos:
            break
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

def fetch_sample_photos(folder, desired_photos, species, size):
    """
    Given a defined set of photos we selected from the dataset, grab them
    from the Internet, and write them in an organized way.

    Structure of the output:
    ./sample-<utime>: output folder 
    ./sample/a.f.fulgens OR ./sample/a.f.styani:
        - images arranged by subspecies
    ./sample/<species>/<rpf-id>_photo.<photo.index>.jpg
    """
    # Build the species output folders based on desired species values
    for specie in species:
        if (specie == "1"):
            os.makedirs(folder + "/a.f.fulgens")
        if (specie == "2"):
            os.makedirs(folder + "/a.f.styani")
    for photo in desired_photos:
        output_species = "a.f.fulgens"
        if photo.species == "2":
            output_species = "a.f.styani"
        output_entity = photo.entity_id
        output_photo_index = photo.photo_index
        output_image = folder + "/" + output_species + "/" + output_entity + "_photo." + output_photo_index + ".jpg"
        # Fetch an image
        fetch_photo(photo.photo_uri, output_image, size)
        random_sleep()

def write_sample_summary(folder, desired_photos):
    """
    Write an informational summary of the sample, as well as all URLs gathered
    and the ownership data/commit info for each one.
    
    Structure of the output:
    ./sample-<utime>: output folder
    ./sample/info.txt: Record and summary of the queried photo data
        - RPF Git commit, sample.py command ran (including animal and photo counts)
    """
    animal_count = str(len(set(map(lambda x: x.entity_id, desired_photos))))
    fulgens = list(filter(lambda x: x.species == "1", desired_photos))
    fulgens_count = str(len(set(map(lambda x: x.entity_id, fulgens))))
    photo_count = str(len(desired_photos))
    styani = list(filter(lambda x: x.species == "2", desired_photos))
    styani_count = str(len(set(map(lambda x: x.entity_id, styani))))
    # Write output metadata
    # TODO: other metadata can be changing, so do we care?
    # If we do, PhotoEntry needs to track more values from the source files
    output_metadata = folder + "/info.txt"
    with open(output_metadata, 'w') as wfh:
        # TODO: high-level data
        wfh.write("panda.count: " + animal_count)
        wfh.write("\npanda.fulgens.count: " + fulgens_count + "\n")
        for photo in fulgens:
            real_uri = unfurl_ig_link(photo.photo_uri)
            wfh.write(photo.entity_id + ".photo." + photo.photo_index + ": " + real_uri + "\n")
            wfh.write(photo.entity_id + ".photo." + photo.photo_index + ".author: " + photo.author_name + "\n")
            wfh.write(photo.entity_id + ".photo." + photo.photo_index + ".commitdate: " + photo.commitdate + "\n")
        wfh.write("panda.styani.count: " + styani_count + "\n")
        for photo in styani:
            real_uri = unfurl_ig_link(photo.photo_uri)
            wfh.write(photo.entity_id + ".photo." + photo.photo_index + ": " + real_uri + "\n")
            wfh.write(photo.entity_id + ".photo." + photo.photo_index + ".author: " + photo.author_name + "\n")
            wfh.write(photo.entity_id + ".photo." + photo.photo_index + ".commitdate: " + photo.commitdate + "\n")

if __name__ == '__main__':
    # Default settings
    animals = 100
    min_photo_count = 0
    photos = 5
    size = "m"
    species = ["1", "2"]   # All Species
    taglist = "close-up, profile, portrait"
    # Parse arguments
    if "--animals" in sys.argv:
        animals = int(sys.argv[sys.argv.index("--animals") + 1])
        if animals < 1:
            print("Animals count must be positive.")
            sys.exit()
    if "--min-photo-count" in sys.argv:
        min_photo_count = int(sys.argv[sys.argv.index("--min-photo-count") + 1])
        if min_photo_count < 1:
            print("Minimum photo count must be positive.")
            sys.exit()
    if "--photos" in sys.argv:
        photos = int(sys.argv[sys.argv.index("--photos") + 1])
        if photos < 1:
            print("Photo count must be positive.")
            sys.exit()
    if "--size" in sys.argv:
        size = sys.argv[sys.argv.index("--size") + 1]
        if ((size != "t") and (size != "m") and (size != "l")):
            raise SizeError("%s photo size is not one of: t m l" % size)
    if "--species" in sys.argv:
        species = int(sys.argv[sys.argv.index("--species") + 1])
        if ((species < 1) or (species > 2)):
            raise SpeciesError("%s species value not 1 or 2 (1: fulgens, 2: styani)" % species)
        species = [str(species)]   # Treat like array of species values
    if "--taglist" in sys.argv:
        taglist = sys.argv[sys.argv.index("--taglist") + 1]
    taglist = taglist.split(", ")
    # The token isn't used here (it's in the fetch function) but if we check here,
    # we'll save time building a sample if we don't have all the necessary things to
    # fetch remote images.
    token = os.getenv('OE_TOKEN', None)
    if token == None:
        raise KeyError("Please set an OE_TOKEN environment variable for using the IG API")
    # Build a sample. If we do a min-photo-count sample set, then we ignore the
    # tag list to guarantee we have enough photos to work with.
    if (min_photo_count > 0):
        photos = define_min_photo_sample(min_photo_count, photos, species)
    else:
        photos = define_random_tag_sample(animals, photos, species, taglist)
    photo_count = str(len(photos))
    if photo_count == 0:
        print("Sample for your arguments contains no photos.")
        sys.exit()
    else:
        print("Sample for your arguments contains %s photos. Fetching..." % photo_count)
    # Unique directory name (with current unixtime)
    folder = "export/sample_" + str(current_time_to_unixtime())
    os.makedirs(folder)
    # Write output information
    write_sample_summary(folder, photos)
    # Start fetching photos
    fetch_sample_photos(folder, photos, species, size)
