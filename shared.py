import configparser
import datetime
import os
import sys

from collections import OrderedDict

# Shared Python information for the Red Panda Lineage scripts
LINKS_PATH = "./links"
MEDIA_PATH = "./media" 
PANDA_PATH = "./pandas"
OUTPUT_PATH = "./export/redpanda.json"
WILD_PATH = "./wild" 
ZOO_PATH = "./zoos"

# Go back no more than this amount of time to get commits
COMMIT_AGE = 7 * 24 * 60 * 60   # 7 days

# IG alphabet for hashes, time ordering oldest to newest
HASH_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"

# Time conversion utility functions
def current_date_to_unixtime():
    """
    Find the unixtime for today's date, at 00:00 hours, for the sake of
    doing one-week windows for new photo updates.
    """
    now = datetime.datetime.now()
    datestring = str(now.year) + "/" + str(now.month) + "/" + str(now.day)
    return datetime_to_unixtime(datestring)

def datetime_to_unixtime(commitdate):
    """
    Take an arbitrary YYYY/MM/DD string and convert it to unixtime, for
    the purpose of determining if a photo was added to RPF during a specific
    time window.
    """
    if commitdate == None:
        return current_date_to_unixtime()
    return int(datetime.datetime.strptime(commitdate, '%Y/%m/%d').strftime("%s"))

def get_max_entity_count():
    """
    Read the export/redpanda.json file. If it doesn't exist, ask one to
    be built. Then read _photo.entity_max from this file, which is the
    highest photo count for a single panda or zoo.
    """
    data = "export/redpanda.json"
    if (os.path.exists(data)):
        with open("export/redpanda.json", "r") as jfh:
            return json.loads(jfh.read())["_photo"]["entity_max"]
    else:
        print("%s file not built yet with build.py -- please generate.")
        sys.exit()

# Exceptions
class AuthorError(ValueError):
    pass

class CommitError(IndexError):
    pass

class DateConsistencyError(ValueError):
    pass

class DateFormatError(ValueError):
    pass

class GenderFormatError(ValueError):
    pass

class IdError(KeyError):
    pass

class LinkError(IndexError):
    pass

class NameFormatError(ValueError):
    pass

class SectionNameError(ValueError):
    pass

class SpeciesError(ValueError):
    pass

# Shared classes
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
        author_commitdate = photo_option + ".commitdate"
        author_link = photo_option + ".link"
        author_tags = photo_option + ".tags"
        panda_tags = "panda.tags"
        print("deleting: " + self.file_path + " -- " + photo_option)
        self.delete_field(photo_option)
        self.delete_field(author_option)
        self.delete_field(author_commitdate)
        self.delete_field(author_link)
        self.delete_field(author_tags)
        # For location group-photo tag lines, look for the numbers in the tag section, 
        # and remove any corresponding location tags from the groups section
        for panda_id in self.get_array(panda_tags):
            photo_location_tag = author_tags + "." + panda_id + ".location"
            self.delete_field(photo_location_tag)
        return True

    def photo_count(self):
        """
        Find the number of photos in this config file.
        """
        photo_index = 1
        photo_option = "photo." + str(photo_index)
        is_photo = self.has_field(photo_option)
        if is_photo == True:
            while is_photo == True:
                photo_index = photo_index + 1
                photo_option = "photo." + str(photo_index)
                is_photo = self.has_field(photo_option)
        return photo_index - 1

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
            photo_commitdate = photo_option + ".commitdate"
            photo_link = photo_option + ".link"
            photo_tags = photo_option + ".tags"
            panda_tags = "panda.tags"
            if self.has_field(photo_option) == False:
                next_index = self.__fetch_next_photo_index(photo_index, stop_point)
                next_option = "photo." + str(next_index)
                next_author = next_option + ".author"
                next_commitdate = next_option + ".commitdate"
                next_link = next_option + ".link"
                next_tags = next_option + ".tags"
                if self.has_field(next_option) == True:
                    self.move_field(photo_option, next_option)
                    self.move_field(photo_author, next_author)
                    self.move_field(photo_commitdate, next_commitdate)
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
