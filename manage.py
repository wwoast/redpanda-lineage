#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import configparser
import os
import re
import sys

from collections import OrderedDict
from shared import MEDIA_PATH, PANDA_PATH, ZOO_PATH, SectionNameError

class ProperlyDelimitedConfigParser(configparser.ConfigParser):
    """
    Standardizes use of ConfigParser for all panda/zoo/media data files, specifically
    the use of colon+space ': ' as the delimiter between key and value. The base
    ConfigParser class surprisingly didn't support this. Also, we change the newline
    writing behavior, because each data file we write only has a single [config] section.
    """
    def write(self, fp, space_around_delimiters=True):
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

class PhotoFile():
    """
    Handles a config file for a panda/zoo/media entry. Track the photos inside one
    of these files, and support deletion operations. Since the ConfigParser API is
    a little bit clunky and since we have an object for dealing with these PhotoFiles
    anyways, wrap the ConfigParser primitives with easier-to-read sugar.
    """
    def __init__(self, section, file_path):
        if section == None:
            raise SectionNameError("""Using wrong section ID to look for photos: %s""" % str(section))

        self.section = section
        # TODO: throw exception for section = None
        self.config = ProperlyDelimitedConfigParser(default_section=self.section, delimiters=(':'))
        self.config.read(file_path, encoding="utf-8")
        self.file_path = file_path
        
    def has_field(self, field_name):
        return self.config.has_option(self.section, field_name)

    def get_array(self, field_name):
        """
        Given a field name, if the value is a comma-delimited string, return
        an array of values.
        """
        if self.has_field(field_name):
            result = self.config.get(self.section, field_name)
            if (result.find(",") != -1):
                return result.replace(" ", "").split(",")
            else:
                return [result]
        return []

    def get_field(self, field_name):
        """
        Given a field name, return it if it exists. If the result is a list of
        comma-separated values, return a list of values. If the value doesn't exist,
        return [] so that other loops can iterate on an empty value.
        """
        if self.has_field(field_name):
            return self.config.get(self.section, field_name)
        else:
            return None

    def set_field(self, field_name, value):
        """
        Set a value in the data file.
        """
        # print("DEBUG SET: " + str(field_name) + " -- " + str(value))
        self.config.set(self.section, field_name, value)

    def copy_field(self, dest_field, source_field):
        """
        Take an existing data field value and copy it to a new field.
        If the source field doesn't exist, do nothing. Return True if
        the field copied properly, or false otherwise.
        """
        if self.has_field(source_field) == True:
            self.set_field(dest_field, self.get_field(source_field))
        return self.has_field(source_field)

    def delete_field(self, field_name):
        """
        Given a field name, and given the existence of that as a key-value pair in
        the data file, remove that field from the file.
        """
        if self.has_field(field_name):
            self.config.remove_option(self.section, field_name)

    def move_field(self, dest_field, source_field):
        """
        Copy the source field value to the destination field, and then delete.
        Return True if the desired destination field exists and has a value.
        """
        if self.copy_field(dest_field, source_field) == True:
            self.delete_field(source_field)
        return self.has_field(dest_field)

    def __strings_number_sensitive(self, input):
        """
        If there's a number in the filename, translate it to its ASCII value.
        This way, the sorting of the number is preserved, rather than treating 
        the digits like characters themselves
        """
        components = input[0].split(".")
        output = []
        for val in components:
            if val.isdigit():
                val = chr(int(val))
            output.append(val)
        return ".".join(output)

    def update_file(self):
        """
        Write the config file out, in alphabetical sorted order just as they are read in.
        """
        with open(self.file_path, 'w', encoding='utf-8') as wfh:
            # Sort the sections before writing
            self.config._defaults = OrderedDict(
                sorted(self.config._defaults.items(), key=self.__strings_number_sensitive))
            self.config.write(wfh)

    def delete_photo(self, index):
        """
        Given an index, delete a photo from the data file. 
        If the baseline photo.X field isn't found, then assume none of the other 
        fields are defined and return False.
        """
        photo_option = "photo." + str(index)
        if self.has_field(photo_option) == False:
            return False
        author_option = photo_option + ".author"
        author_link = photo_option + ".link"
        author_tags = photo_option + ".tags"
        panda_tags = "panda.tags"
        # print("DEBUG REMOVE: " + path + " -- " + photo_author + " -- " + photo_option)
        self.delete_field(photo_option)
        self.delete_field(author_option)
        self.delete_field(author_link)
        self.delete_field(author_tags)
        # For location group-photo tag lines, look for the numbers in the tag section, 
        # and remove any corresponding location tags from the groups section
        for panda_id in self.get_array(panda_tags):
            photo_location_tag = author_tags + "." + panda_id + ".location"
            self.delete_field(photo_location_tag)
        return True

    def __fetch_next_photo_index(self, start_point, stop_point):
        """
        Given we deleted pandas from a dataset entry, find the first available hole in
        the list of photos, and the next available photo to move into that hole.
        """
        photo_index = start_point
        photo_option = "photo." + str(photo_index)
        is_photo = self.has_field(photo_option)
        if is_photo == True:
            # Find the first hole (slot without a photo)
            while is_photo == True:
                photo_index = photo_index + 1
                photo_option = "photo." + str(photo_index)
                is_photo = self.has_field(photo_option)
                if photo_index > stop_point:
                    return 0
        # Now that we're in holes, find the next valid photo
        while is_photo == False:
            photo_index = photo_index + 1
            photo_option = "photo." + str(photo_index)
            is_photo = self.has_field(photo_option)
            # If start point went beyond the last photo, return zero
            if photo_index > stop_point:
                return 0
        return photo_index

    def renumber_photos(self, stop_point):
        """
        After a deletion operation, renumber all photos in the file so that
        there are no gaps in the photo numbering.
        """
        start_index = 1
        photo_index = start_index
        while photo_index <= stop_point:
            # If a photo doesn't exist, find the next photo that exists and swap its value
            photo_option = "photo." + str(photo_index)
            photo_author = photo_option + ".author"
            photo_link = photo_option + ".link"
            photo_tags = photo_option + ".tags"
            panda_tags = "panda.tags"
            if self.has_field(photo_option) == False:
                next_index = self.__fetch_next_photo_index(photo_index, stop_point)
                next_option = "photo." + str(next_index)
                next_author = next_option + ".author"
                next_link = next_option + ".link"
                next_tags = next_option + ".tags"
                if self.has_field(next_option) == True:
                    self.move_field(photo_option, next_option)
                    self.move_field(photo_author, next_author)
                    self.move_field(photo_link, next_link)
                    self.move_field(photo_tags, next_tags)
                    for panda_id in self.get_array(panda_tags):
                        photo_location_tag = photo_tags + "." + panda_id + ".location"
                        next_location_tag = next_tags + "." + panda_id + ".location"
                        self.move_field(photo_location_tag, next_location_tag)
            photo_index = photo_index + 1
            
    def remove_author(self, author):
        """
        Given all entries in a photo file with a matching author entry, remove those 
        fields from the photos list.
        """
        start_index = 1
        removals = 0
        photo_index = start_index
        author_option = "photo." + str(photo_index) + ".author"
        while self.has_field(author_option):
            photo_author = self.get_field(author_option)
            if author == photo_author:
                self.delete_photo(photo_index)
                removals = removals + 1
            photo_index = photo_index + 1
            author_option = "photo." + str(photo_index) + ".author"
        # Next, renumber the ones that are still there
        if removals > 0:
            self.renumber_photos(photo_index)

def remove_author_from_lineage(author):
    """
    Occasionally users will remove or rename their photo files online.
    For cases where the original files cannot be recovered, it may be
    simpler to remove photos by an author and add them back later.

    Given a author (typically an Instagram username), remove their photos
    from every panda or zoo data entry.
    """
    for file_path in [PANDA_PATH, ZOO_PATH, MEDIA_PATH]:
        section = None
        for section_name in ["media", "zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                photo_list = PhotoFile(section, path)
                photo_list.remove_author(author)
                # Done? Let's write config
                photo_list.update_file()

def remove_photo_from_file(path, photo_id):
    """
    Given a file path and a photo index ID, remove the photo and renumber
    all photos inside the file. Determine what the proper configuration
    section header should be from the path itself.
    """
    section = None
    for section_name in ["wild", "media", "zoos", "pandas"]:
        if section_name in path.split("/"):
            section = section_name.split("s")[0]   # HACK
    photo_list = PhotoFile(section, path)
    if photo_list.delete_photo(photo_id) == True:
        # TODO: find max index
        photo_list.renumber_photos(130)
        photo_list.update_file()

if __name__ == '__main__':
    """Choose a utility funciton."""
    if len(sys.argv) == 3:
        if sys.argv[1] == "--remove-author":
            author = sys.argv[2]
            remove_author_from_lineage(author)
    if len(sys.argv) == 4:
        if sys.argv[1] == "--remove-photo":
            file_path = sys.argv[2]
            photo_id = sys.argv[3]
            remove_photo_from_file(file_path, photo_id)
