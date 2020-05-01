#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import configparser
import git
import json
import os
import re
import sys

from collections import OrderedDict
from shared import MEDIA_PATH, PANDA_PATH, ZOO_PATH, SectionNameError
from unidiff import PatchSet

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

def find_commit_of_removed_photos(author, repo):
    """
    Iterate through the Git repo and find the most recent commit where an 
    author's photos were removed.
    """
    counter = 0
    compare = repo.commit("HEAD")
    for commit in repo.iter_commits('master'):
        diff_raw = repo.git.diff(compare, 
                                 commit,
                                 ignore_blank_lines=True,
                                 ignore_space_at_eol=True)
        patch = PatchSet(diff_raw)
        for change in patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.removed <= 0:
                # No lines were removed, so we don't care
                continue
            else:
                for hunk in change:
                    for line in hunk:
                        if line.is_removed:
                            # author must be at the end of a line, prepended with ": "
                            line = line.value.strip()
                            search_string = ": " + author
                            if len(line) <= len(search_string):
                                continue
                            expected_location = len(line) - len(search_string)
                            if line.find(search_string) == expected_location:
                                counter = counter + 1
        if counter > 0:
            return commit
        else:
            # Prepare for the next iteration
            compare = commit

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

def remove_author_from_lineage(author):
    """
    Occasionally users will remove or rename their photo files online.
    For cases where the original files cannot be recovered, it may be
    simpler to remove photos by an author and add them back later.

    Given a author (typically an IG username), remove their photos
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
        # Read max from an existing photo
        max = int(get_max_entity_count())
        photo_list.renumber_photos(max)
        photo_list.update_file()

def restore_author_to_lineage(author, prior_commit=None):
    """
    Find the most recent commit where photos by an author were removed.
    Re-add them to the pandas they were removed from. For any panda that
    had photos restored, sort their photo hashes.
    """
    repo = git.Repo(".")
    if prior_commit == None:
        prior_commit = find_commit_of_removed_photos(author, repo)
    # Go back one more from this commit
    current_commit = prior_commit
    prior_commit = str(prior_commit) + "~1"    
    diff_raw = repo.git.diff(prior_commit, 
                             current_commit,
                             ignore_blank_lines=True,
                             ignore_space_at_eol=True)
    # Make list of removed lines per filename, and convert.
    # Handjam this just by iterating on file lines
    path_to_photo_index = {}
    patch = PatchSet(diff_raw)
    for change in patch:
        filename = change.path
        if filename.find(".txt") == -1:
            # Don't care about non-data files
            continue
        elif change.removed <= 0:
            # No lines were removed, so we don't care
            continue
        else:
            # Prepare to add lines
            path_to_photo_index[filename] = {}
            for hunk in change:
                for line in hunk:
                    if line.is_removed:
                        if line.value.find("photo.") != 0:
                            continue
                        [key, value] = line.value.strip().split(": ")
                        path_to_photo_index[filename][key] = value
    # Delete any items where the author isn't the given
    for path in path_to_photo_index.keys():
        for option in list(path_to_photo_index[path].keys()):
            index = option.split(".")[1]
            if path_to_photo_index[path].get("photo." + index + ".author") != author:
                path_to_photo_index[path].pop(option)
    # Iterate through files that are getting photos back.
    # Add the photos to the ends of the files
    print(str(path_to_photo_index))
    for path in path_to_photo_index.keys():
        if not os.path.exists(path):
            # File may have been moved.
            print("%s:\nfile no longer exists, so where do I put this?" % path)
            for key in path_to_photo_index[path].keys():
                print("%s: %s" % (key, value))
            continue
        section = None
        for section_name in ["wild", "media", "zoos", "pandas"]:
            if section_name in path.split("/"):
                section = section_name.split("s")[0]   # HACK
        photo_list = PhotoFile(section, path)
        photo_count = photo_list.photo_count()
        photo_index = photo_count + 1
        # Swap the old index to one that's not currently in the file
        for key in path_to_photo_index[path].keys():
            index = key.split(".")[1]
            key.replace("." + index + ".", "." + str(photo_index) + ".")
            value = path_to_photo_index[path][key]
            photo_list.set_field(key, value)
            print("%s: %s" % (key, value))
        # Update the list of photos
        # photo_list.update_file()
    # Finally, sort the photo files
    # for path in path_to_photo_index.keys():
    #    sort_ig_hashes(path)

def sort_ig_hashes(path):
    """
    Take a zoo/panda file, and sort all photos by their IG hashes. 
    This makes the photos appear in the order they were uploaded to IG,
    oldest to newest. 
    If a photo does not use an IG URI, keep its index unchanged.
    """
    # IG alphabet for hashes, time ordering oldest to newest
    hash_order = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    section = None
    for section_name in ["wild", "zoos", "media", "pandas"]:
        if section_name in path.split("/"):
            section = section_name.split("s")[0]   # HACK
    photo_list = PhotoFile(section, path)
    photo_count = photo_list.photo_count()
    max = int(get_max_entity_count()) + 1
    if photo_count >= max:
        max = photo_count + 1
    non_ig_indices = []
    ig_photos = []
    # Build photo indices of IG photos and non-IG photos
    start_index = 1
    stop_point = max
    photo_index = start_index
    while photo_index <= stop_point:
        photo_option = "photo." + str(photo_index)
        photo = photo_list.get_field(photo_option)
        if photo == None:
            # Missing photo at this index, continue
            photo_index = photo_index + 1
            continue
        elif "https://www.instagram.com" in photo:
            # Track the photo and index as a tuple
            ig_photos.append([photo, photo_index])
            # Rename all photo fields as "old_photo_field"
            photo_list.move_field("old." + photo_option, photo_option)
            photo_list.move_field("old." + photo_option + ".author", photo_option + ".author")
            photo_list.move_field("old." + photo_option + ".link", photo_option + ".link")
            photo_list.move_field("old." + photo_option + ".tags", photo_option + ".tags")
            if section == "media":
                panda_tags = photo_list.get_field("panda.tags").split(", ")
                for panda_id in panda_tags:
                    photo_item = photo_option + ".tags." + panda_id + ".location"
                    photo_list.move_field("old." + photo_item, photo_item)
        else:
            # Track the non-ig index, so we can avoid it
            # Don't need to rename these photos
            non_ig_indices.append(photo_index)
        photo_index = photo_index + 1
    # Sort the list of ig photo tuples by photo URL 
    # (the 0th item in each tuple is the url)
    # (the 4th item in each URL is the ig photo hash)
    ig_photos = sorted(
        ig_photos, 
        key=lambda x: 
            [hash_order.index(char) for char in x[0].split("/")[4]])
    ig_photos = sorted(ig_photos, key=lambda x: len(x[0].split("/")[4]))
    # Now, re-distribute the photos, iterating down the ig
    # photos, moving "old_photo_field" to "photo_field" but with
    # updated indices
    list_index = start_index
    photo_index = start_index
    while photo_index <= stop_point:
        if (list_index - 1 == len(ig_photos) + len(non_ig_indices)):
            # No more photos, for certain
            break
        [photo, old_index] = ig_photos[list_index - 1]
        photo_index = list_index
        while photo_index in non_ig_indices:
            photo_index = photo_index + 1   # Avoid indices for non-IG photos
        current_option = "photo." + str(photo_index)
        old_option = "old.photo." + str(old_index)
        photo_list.move_field(current_option, old_option)
        photo_list.move_field(current_option + ".author", old_option + ".author")
        photo_list.move_field(current_option + ".link", old_option + ".link")
        photo_list.move_field(current_option + ".tags", old_option + ".tags")
        if section == "media":
            panda_tags = photo_list.get_field("panda.tags").split(", ")
            for panda_id in panda_tags:
                current_loc_tag =  current_option + ".tags." + panda_id + ".location"
                old_loc_tag = old_option + ".tags." + panda_id + ".location"
                photo_list.move_field(current_loc_tag, old_loc_tag)
        list_index = list_index + 1
    # We're done. Update the photo file
    photo_list.update_file()

def sort_ig_updates():
    """
    Any data file that was updated in the last commit, do a sort operation for the
    IG hashes, leaving non-IG files unchanged.
    """
    repo = git.Repo(".")
    prior_commit = repo.commit("HEAD~1")
    current_commit = repo.commit("HEAD")
    diff_raw = repo.git.diff(prior_commit, 
                             current_commit,
                             ignore_blank_lines=True,
                             ignore_space_at_eol=True)
    patch = PatchSet(diff_raw)
    for change in patch:
        filename = change.path
        if filename.find(".txt") == -1:
            # Don't care about non-data files
            continue
        elif change.added > 0:
            sort_ig_hashes(filename)


if __name__ == '__main__':
    """Choose a utility funciton."""
    if len(sys.argv) == 2:
        if sys.argv[1] == "--sort-instagram-updates":
            sort_ig_updates()
    if len(sys.argv) == 3:
        if sys.argv[1] == "--remove-author":
            author = sys.argv[2]
            remove_author_from_lineage(author)
        if sys.argv[1] == "--restore-author":
            author = sys.argv[2]
            restore_author_to_lineage(author)
        if sys.argv[1] == "--sort-instagram-hashes":
            file_path = sys.argv[2]
            sort_ig_hashes(file_path)
    if len(sys.argv) == 4:
        if sys.argv[1] == "--remove-photo":
            file_path = sys.argv[2]
            photo_id = sys.argv[3]
            remove_photo_from_file(file_path, photo_id)
        if sys.argv[1] == "--restore-author":
            author = sys.argv[2]
            commit = sys.argv[3]
            restore_author_to_lineage(author, commit)

