import configparser
import datetime
import json
import os
import sys
import random
import requests
import time

from collections import OrderedDict
from urllib.parse import urlparse

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

def current_time_to_unixtime():
    return datetime.datetime.now().strftime("%s")

def datetime_to_unixtime(commitdate):
    """
    Take an arbitrary YYYY/MM/DD string and convert it to unixtime, for
    the purpose of determining if a photo was added to RPF during a specific
    time window.
    """
    if commitdate == None:
        return current_date_to_unixtime()
    return int(datetime.datetime.strptime(commitdate, '%Y/%m/%d').strftime("%s"))

def fetch_photo(url, output_file=None, size=None):
    """
    For testing/validating photo dimensions and properties, grab a photo using
    either the direct URI, or for IG uris, using their oEmbed API.
    This function requires an Instagram URL of the form:
        https://www.instagram.com/p/<shortcode>/media/?size=<size>
    """
    ig_url = update_ig_link(url)    # convert to ig:// if necessary
    ig_url = resize_ig_link(ig_url, size)   # request biger size if necessary
    target_img = url
    # Assume target_img is the original url unless IG
    if "ig://" in ig_url:
        shortcode = ig_url.split("/")[2]
        # Remove extra info from the IG url so that oEmbed likes it
        url = "https://www.instagram.com/p/" + shortcode
        maxwidth = 320
        if (ig_url.split("/")[3] == "l"):
            maxwidth = 640
        token = os.getenv('OE_TOKEN', None)
        if token == None:
            raise KeyError("Please set an OE_TOKEN environment variable for using the IG API")
        query_params = {
            "url": url,
            "maxwidth": maxwidth,
            "fields": "thumbnail_url,author_name",
            "access_token": token
        }
        instagram_api = "https://graph.facebook.com/v8.0/instagram_oembed"
        response = requests.get(instagram_api, params=query_params)
        json = response.json()
        target_img = json["thumbnail_url"]
        author_name = json["author_name"]
        if (output_file == None):
            output_file = shortcode + ".jpg"
        print("(ig_credit: " + author_name + "): " + target_img)
    else:
        if (output_file == None):
            output_file = os.path.basename(urlparse(url).path)
        print("(web): " + target_img)
    img = requests.get(target_img, allow_redirects=True)
    with open(output_file, "wb") as ofh:
        print ("(output): " + output_file)
        ofh.write(img.content)

# Other utility functions
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

def random_sleep():
    random_seconds = random.randint(1, 10)
    time.sleep(random_seconds)

def resize_ig_link(photo_uri, size):
    """
    Convert ig://<shortcode>/<size> into the size you want
    """
    if size == None:
        return photo_uri
    elif "ig://" in photo_uri:
        shortcode = photo_uri.split("/")[2]
        return 'ig://' + shortcode + "/" + size
    else:
        return photo_uri

def unfurl_ig_link(photo_uri):
    """
    Convert ig://<shortcode>/ back into a real URL
    """
    if "ig://" in photo_uri:
        shortcode = photo_uri.split("/")[2]
        return 'https://www.instagram.com/p/' + shortcode + "/"
    else:
        return photo_uri

def update_ig_link(photo_uri):
    """
    Convert all IG links from format #1 to format #2:
        https://www.instagram.com/p/<shortcode>/media/?size=<size>
        ig://<shortcode>/<size>
    This saves space in the redpanda.json epxorts, and makes it simpler for the 
    RPF JS code to identify the IG links that it needs to use the FB oembed API for.
    """
    if "https://www.instagram.com/p/" in photo_uri:
        photo_split = photo_uri.split("/")
        shortcode = photo_split[4]
        size = photo_split[6].split("=")[1]
        return 'ig://' + shortcode + "/" + size
    else:
        return photo_uri

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

class PhotoEntry:
    """
    Represents all properties of a photo entry in a file.
    Intended as a better way to track whether photos are new or not,
    but also used for panda info for individual photo samples.

    In the build script, files are read line by line, and added to
    photo entities based on their locator ID (<entity_id>.photo.<photo_id>).
    The UpdateFromCommits class uses hash tables of these by 
    locator ID to make accurate counts of new photos, new entities, 
    and new contributors.
    """
    def __init__(self, filename, raw):
        self.filename = filename
        self.author_name = None
        self.commitdate = None
        self.entity_commitdate = None
        self.entity_id = None
        self.entity_type = None
        self.photo_index = None
        self.photo_uri = None
        self.species = None
        # Read in the entity details from the backing file just once
        self._read_update_entity_id(raw)
    
    def entity_locator(self):
        return self.entity_type + "." + self.entity_id

    def photo_locator(self):
        return self.entity_locator() + ".photo." + self.photo_index

    def _read_update_entity_id(self, raw):
        """
        Open the config file and read its _id value.
        Store the entity_type and entity_id for each photo.
        
        Read the raw line and return a corresponding entity ID to track
        in one of the "media|panda|zoo" object tables. We're specifically
        looking for updates matching the form: "photo.X: url".
        """
        key = raw.split(":")[0]
        photo_uri = raw[len(key) + 1:].strip()
        photo_index = key.split(".")[1]
        config = configparser.ConfigParser()
        self.filename = "./" + self.filename   # Standardize path
        if not os.path.exists(self.filename):
            # Fallback to filename number and path for entity
            # This is a hack for when files are renamed
            if self.filename.find(MEDIA_PATH) != -1:
                self.entity_type = "media"
            elif self.filename.find(PANDA_PATH) != -1:
                self.entity_type = "panda"
            elif self.filename.find(ZOO_PATH) != -1:
                self.entity_type = "zoo"
            # Consider whole path, and remove leading zeroes from id
            self.entity_id = self.filename.split("/").pop().split("_")[0].lstrip("0")
            # Other items will be entered as None
            return
        # Set all values based on entity and photo info        
        config.read(self.filename, encoding='utf-8')
        if self.filename.find(MEDIA_PATH) != -1:
            entity = config.get("media", "_id")
            self.entity_type = entity.split(".")[0]
            self.entity_id = entity[len(self.entity_type) + 1:]
            self.entity_commitdate = config.get("media", "commitdate")
            self.author_name = config.get("media", key + ".author")
            self.commitdate = config.get("media", key + ".commitdate")
            self.photo_index = photo_index
            self.photo_uri = photo_uri
        elif self.filename.find(PANDA_PATH) != -1:
            self.entity_type = "panda"
            self.entity_id = config.get("panda", "_id")
            self.entity_commitdate = config.get("panda", "commitdate")
            self.author_name = config.get("panda", key + ".author")
            self.commitdate = config.get("panda", key + ".commitdate")
            self.photo_index = photo_index
            self.photo_uri = photo_uri
            self.species = config.get("panda", "species")
        elif self.filename.find(ZOO_PATH) != -1:
            self.entity_type = "zoo"
            self.entity_id = config.get("zoo", "_id")
            self.entity_commitdate = config.get("zoo", "commitdate")
            self.author_name = config.get("zoo", key + ".author")
            self.commitdate = config.get("zoo", key + ".commitdate")
            self.photo_index = photo_index
            self.photo_uri = photo_uri
        elif self.filename.find(WILD_PATH) != -1:
            self.entity_type = "wild"
            self.entity_id = config.get("wild", "_id")
            self.entity_commitdate = config.get("wild", "commitdate")
            self.author_name = config.get("wild", key + ".author")
            self.commitdate = config.get("wild", key + ".commitdate")
            self.photo_index = photo_index
            self.photo_uri = photo_uri
        else:
            pass

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

    def field_equals_value(self, field_name, desired_value):
        if self.config.has_option(self.section, field_name) == False:
            return False
        value = self.config.get(self.section, field_name)
        if (value == desired_value):
            return True

    def get_array(self, field_name):
        """
        Given a field name, if the value is a (comma+space)-delimited string,
        return an array of values.
        """
        if self.has_field(field_name):
            result = self.config.get(self.section, field_name)
            if (result.find(", ") != -1):
                return result.split(", ")
            else:
                return [result]
        return []

    def array_has_value(self, field_name, desired_values):
        """
        Check something like the tags list for a particular tag value.
        """
        if self.config.has_option(self.section, field_name) == False:
            return False
        value_list = self.get_array(field_name)
        for desired_value in desired_values:
            if desired_value in value_list:
                return True
        # No desired values in the array
        return False

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
