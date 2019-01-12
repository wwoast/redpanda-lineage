#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import configparser
import os
import re
import sys

from collections import OrderedDict
from shared import PANDA_PATH, ZOO_PATH


class ProperlyDelimitedConfigParser(configparser.ConfigParser):
    def write(self, fp, space_around_delimiters=True):
        """
        Virtually identical to the original method, but delimit keys and values
        with ': ' as the delimiter, a humane and sensibly typed delimiter that
        the default ConfigParser class doesn't support. Also, each file we write
        only has a single section, so don't write newlines again.
        """
        if space_around_delimiters:
            d = "{} ".format(self._delimiters[0])
        else:
            d = self._delimiters[0]
        if self._defaults:
            self._write_section(fp, self.default_section,
                                self._defaults.items(), d)

    def _write_section(self, fp, section_name, section_items, delimiter):
        """Write a single section to the specified `fp'."""
        fp.write("[{}]\n".format(section_name))
        for key, value in section_items:
            value = self._interpolation.before_write(self, section_name, key,
                                                     value)
            if value is not None or not self._allow_no_value:
                value = delimiter + str(value).replace('\n', '\n\t')
            else:
                value = ""
            fp.write("{}{}\n".format(key, value))

def fetch_next_photo_index(config, start_point, stop_point):
    """
    Given we deleted pandas from a dataset entry, find the first available hole in
    the list of photos, and the next available photo to move into that hole.
    """
    photo_index = start_point
    photo_option = "photo." + str(photo_index)
    is_photo = config.has_option("panda", photo_option)
    if is_photo == True:
        # Find the first hole (slot without a photo)
        while is_photo == True:
            photo_index = photo_index + 1
            photo_option = "photo." + str(photo_index)
            is_photo = config.has_option("panda", photo_option)
            if photo_index > stop_point:
                return 0
    # Now that we're in holes, find the next valid photo
    while is_photo == False:
        photo_index = photo_index + 1
        photo_option = "photo." + str(photo_index)
        is_photo = config.has_option("panda", photo_option)
        # If start point went beyond the last photo, return zero
        if photo_index > stop_point:
            return 0
    return photo_index

def renumber_panda_photos(config, stop_point):
    """
    Given a file that's just had photos removed from it, renumber all the
    remaining photos so that there are no gaps.
    """
    start_index = 1
    photo_index = start_index
    while photo_index <= stop_point:
        # If a photo doesn't exist, find the next photo that exists and swap its value
        photo_option = "photo." + str(photo_index)
        photo_author = photo_option + ".author"
        photo_link = photo_option + ".link"
        photo_tags = photo_option + ".tags"
        if config.has_option("panda", photo_option) == False:
            next_index = fetch_next_photo_index(config, photo_index, stop_point)
            next_option = "photo." + str(next_index)
            next_author = next_option + ".author"
            next_link = next_option + ".link"
            next_tags = next_option + ".tags"
            if config.has_option("panda", next_option) == True:
                config.set("panda", photo_option, config.get("panda", next_option))
                config.set("panda", photo_author, config.get("panda", next_author))
                config.set("panda", photo_link, config.get("panda", next_link))
                if config.has_option("panda", next_tags):
                    config.set("panda", photo_tags, config.get("panda", next_tags))
                else:
                    config.remove_option("panda", photo_tags)
                config.remove_option("panda", next_option)
                config.remove_option("panda", next_author)
                config.remove_option("panda", next_link)
                config.remove_option("panda", next_tags)
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
    removals = 0
    # Enter the pandas subdirectories
    for root, dirs, files in os.walk(PANDA_PATH):
        for filename in files:
            photo_index = start_index
            path = root + os.sep + filename
            config = ProperlyDelimitedConfigParser(default_section="panda", delimiters=(':'))
            config.read(path, encoding="utf-8")
            photo_option = "photo." + str(photo_index)
            author_option = photo_option + ".author"
            author_link = photo_option + ".link"
            author_tags = photo_option + ".tags"
            # Look at all available photo fields for a panda, until we get to
            # the Nth photo that doesn't exist 
            while config.has_option("panda", author_option) == True:
                panda_author = config.get("panda", "photo." + str(photo_index) + ".author")
                if author == panda_author:
                    # print("DEBUG REMOVE: " + path + " -- " + panda_author + " -- " + photo_option)
                    config.remove_option("panda", photo_option)
                    config.remove_option("panda", author_option)
                    config.remove_option("panda", author_link)
                    if config.has_option("panda", author_tags):
                        config.remove_option("panda", author_tags)
                    removals = removals + 1
                photo_index = photo_index + 1
                photo_option = "photo." + str(photo_index)
                author_option = photo_option + ".author"
                author_link = photo_option + ".link"
                author_tags = photo_option + ".tags"
            # Next, renumber the ones that are still there
            if removals > 0:
                renumber_panda_photos(config, photo_index)
            # Done? Let's write config
            write_config(config, "panda", path)

def remove_zoo_photos(author):
    """
    Zoos only have a single photo recorded for each one, and no tags
    """
    # Enter the zoo subdirectories
    for root, dirs, files in os.walk(ZOO_PATH):
        for filename in files:
            path = root + os.sep + filename
            config = ProperlyDelimitedConfigParser(default_section="zoo", delimiters=(':'))
            config.read(path, encoding="utf-8")
            if config.has_option("zoo", "photo.author") == True:
                zoo_author = config.get("zoo", "photo.author")
                if zoo_author == author:
                    config.remove_option("zoo", "photo") 
                    config.remove_option("zoo", "photo.author") 
                    config.remove_option("zoo", "photo.link")
            # Done with removals?
            write_config(config, "zoo", path)

def strings_number_sensitive(input):
    """
    If there's a number in the filename, translate it to its equivalent ASCII value. This way, the
    sorting of the number is preserved, rather than treating the digits like characters themselves
    """
    components = input[0].split(".")
    output = []
    for val in components:
        if val.isdigit():
            val = chr(int(val))
        output.append(val)
    return ".".join(output)

def write_config(config, section, path):
    """
    Write the config file out, in alphabetical sorted order just as they are read in.
    """
    with open(path, 'w', encoding='utf-8') as wfh:
        # Sort the sections before writing
        config._defaults = OrderedDict(sorted(config._defaults.items(), key=strings_number_sensitive))
        config.write(wfh)

if __name__ == '__main__':
    """Choose a utility funciton."""
    if len(sys.argv) == 3:
        if sys.argv[1] == "--remove-photos":
            remove_panda_photos(sys.argv[2])
            remove_zoo_photos(sys.argv[2])
