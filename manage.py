#!/usr/bin/python3

# This Red Panda Lineage dataset management tool is useful for doing sweeping dataset
# revisions, such as ensuring that a field exists in each panda or zoo file, or removing
# photos taken by a specific credited author.

import configparser
import datetime
import git
import json
import os
import re
import sys

from collections import OrderedDict
from shared import MEDIA_PATH, PANDA_PATH, ZOO_PATH, CommitError, SectionNameError, datetime_to_unixtime
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

def remove_duplicate_photo_uris_per_file():
    """
    If a file has the same photo URI multiple times, make a new photo entry
    with a union of the tags for each one, and the earlier commitdate.
    TODO: support media duplicates
    """
    max = int(get_max_entity_count())
    for file_path in [PANDA_PATH, ZOO_PATH]:
        section = None
        for section_name in ["zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                # print(path)
                photo_list = PhotoFile(section, path)
                photo_count = photo_list.photo_count()
                photo_index = 1
                seen = {}
                duplicates = {}
                while (photo_index <= photo_count):
                    current_option = "photo." + str(photo_index)
                    current_uri = photo_list.get_field(current_option)
                    current_author_option = current_option + ".author"
                    current_author = photo_list.get_field(current_author_option)
                    current_date_option = current_option + ".commitdate"
                    current_date = photo_list.get_field(current_date_option)
                    current_date_value = datetime_to_unixtime(current_date)
                    current_link_option = current_option + ".link"
                    current_link = photo_list.get_field(current_link_option)
                    current_tags_option = current_option + ".tags"
                    current_tags = photo_list.get_field(current_tags_option)
                    if current_uri in seen:
                        # We have a duplicate
                        seen_date_value = datetime_to_unixtime(seen[current_uri]["commitdate"])
                        seen_tags = seen[current_uri]["tags"]
                        # Resolve dates and tags
                        if (current_date_value < seen_date_value):
                            seen[current_uri]["commitdate"] = current_date_value
                        # Handle when either of the duplicates have no tags
                        if seen_tags == None and current_tags != None:
                            seen[current_uri]["tags"] = current_tags
                        if seen_tags != None and current_tags != None: 
                            tag_list = current_tags.split(", ") + seen_tags.split(", ")
                            tag_list = sorted(list(dict.fromkeys(tag_list)))   # deduplicate tags
                            seen[current_uri]["tags"] = ", ".join(tag_list)
                        # Add to duplicates list in its current form
                        duplicates[current_uri] = seen[current_uri]
                        # Remove from the photo list
                        photo_list.delete_photo(photo_index)
                        photo_list.delete_photo(seen[current_uri]["old_index"])
                    elif current_uri in duplicates:
                        # We have something duplicated more than once
                        seen_date_value = datetime_to_unixtime(duplicates[current_uri]["commitdate"])
                        seen_tags = duplicates[current_uri]["tags"]
                        # Resolve dates and tags
                        if (current_date_value < seen_date_value):
                            duplicates[current_uri]["commitdate"] = current_date_value
                        # Handle when either of the duplicates have no tags
                        if seen_tags == None and current_tags != None:
                            seen[current_uri]["tags"] = current_tags
                        if seen_tags != None and current_tags != None:
                            tag_list = current_tags.split(", ") + seen_tags.split(", ")
                            tag_list = sorted(list(dict.fromkeys(tag_list)))   # deduplicate tags
                            duplicates[current_uri]["tags"] = ", ".join(tag_list)
                        # Remove from the photo list
                        photo_list.delete_photo(photo_index)
                    else:
                        seen[current_uri] = {}
                        seen[current_uri]["old_index"] = photo_index
                        seen[current_uri]["author"] = current_author
                        seen[current_uri]["commitdate"] = current_date
                        seen[current_uri]["link"] = current_link
                        seen[current_uri]["tags"] = current_tags
                    photo_index = photo_index + 1
                for photo_uri in duplicates.keys():
                    # Add duplicates back to photo file, starting at the newest index
                    photo_option = "photo." + str(photo_index)
                    author_option = photo_option + ".author"
                    author = duplicates[photo_uri]["author"]
                    date_option = photo_option + ".commitdate"
                    date = duplicates[photo_uri]["commitdate"]
                    link_option = photo_option + ".link"
                    link = duplicates[photo_uri]["link"]
                    tags_option = photo_option + ".tags"
                    tags = duplicates[photo_uri]["tags"]
                    photo_list.set_field(photo_option, photo_uri)
                    photo_list.set_field(author_option, author)
                    photo_list.set_field(date_option, date)
                    photo_list.set_field(link_option, link)
                    if (tags != None):
                        photo_list.set_field(tags_option, tags)
                    photo_index = photo_index + 1
                # Update the file if there were any changes, and re-sort the hashes
                duplicate_count = len(duplicates.keys())
                if duplicate_count > 0:
                    print("deduplicated: %s (%s duplicated)" % (path, duplicate_count))
                    photo_list.renumber_photos(max)
                    photo_list.update_file()
                    sort_ig_hashes(path)

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
        index_map = {}
        # Swap the old index to one that's not currently in the file
        for key in path_to_photo_index[path].keys():
            index = key.split(".")[1]
            if index_map.get(index) == None:
                index_map[index] = photo_index
                photo_index = photo_index + 1
            value = path_to_photo_index[path][key]
            key = key.replace("photo." + index, "photo." + str(index_map[index]))
            photo_list.set_field(key, value)
            # print("%s: %s" % (key, value))
        # Update the list of photos
        photo_list.update_file()
    # Finally, sort the photo files
    for path in path_to_photo_index.keys():
        sort_ig_hashes(path)

def sort_ig_hashes(path):
    """
    Take a zoo/panda file, and sort all photos by their IG hashes. 
    This makes the photos appear in the order they were uploaded to IG,
    oldest to newest. 
    If a photo does not use an IG URI, keep its index unchanged.
    """
    # IG alphabet for hashes, time ordering oldest to newest
    # print(path)
    print("sorting: %s" % path)
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
            photo_list.move_field("old." + photo_option + ".commitdate", photo_option + ".commitdate")
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
    used_indices = []
    while photo_index <= stop_point:
        if list_index - 1 == len(ig_photos):
            # No more photos, for certain
            break
        [photo, old_index] = ig_photos[list_index - 1]
        photo_index = list_index
        while photo_index in non_ig_indices:
            photo_index = photo_index + 1   # Avoid indices for non-IG photos
        while photo_index in used_indices:
            photo_index = photo_index + 1   # Avoid indices we already used
        used_indices.append(photo_index)
        current_option = "photo." + str(photo_index)
        old_option = "old.photo." + str(old_index)
        photo_list.move_field(current_option, old_option)
        photo_list.move_field(current_option + ".author", old_option + ".author")
        photo_list.move_field(current_option + ".commitdate", old_option + ".commitdate")
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
    IG hashes, leaving non-IG files unchanged. Also add commit dates for any photos
    that don't have them
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
    # Finish by adding entity and photo commit dates
    update_entity_commit_dates(prior_commit.hexsha)
    update_photo_commit_dates(prior_commit.hexsha)

def update_entity_commit_dates(starting_commit):
    """
    When moving pandas, the old redpandafinder updater logic considered "new" 
    animals as anything that was a new file in a location. So when an animal
    moved zoos, it became _new_ again. Rectify this by tracking when the
    commitdate for each new animal is. Track commit dates for other files too,
    just for the hell of it.
    """
    filename_to_commit_date = {}
    type_id_to_commit_date = {}
    repo = git.Repo(".")
    # List of sha1-name commits from the repo, oldest to newest
    commit_list = list(reversed(list(map(lambda x: x.hexsha, repo.iter_commits()))))
    if starting_commit != None:
        try:
            index = commit_list.index(starting_commit)
        except IndexError as e:
            raise CommitError("%s not a valid commit in this repo." % starting_commit)
        commit_list = commit_list[index:]   # All after, and including the given commit
    for index, commitish in enumerate(commit_list):
        # End of the commit list? Call it a day
        if commitish == commit_list[len(commit_list) - 1]:
            break
        # Get the diff
        start = commitish
        end = commit_list[index + 1] 
        diff_raw = repo.git.diff(start, end, 
                                 ignore_blank_lines=True,
                                 ignore_space_at_eol=True)
        patch = PatchSet(diff_raw)
        for change in patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.is_added_file == True:
                compare = "./" + filename
                dt = repo.commit(end).committed_datetime
                date = str(dt.year) + "/" + str(dt.month) + "/" + str(dt.day)
                just_file = filename.split("/").pop()
                just_type = None
                just_id = None
                if compare.find(PANDA_PATH) == 0:
                    just_type = "panda"
                    just_id = just_file.split("_")[0]
                elif compare.find(ZOO_PATH) == 0:
                    just_type = "zoo"
                    just_id = just_file.split("_")[0]
                elif compare.find(MEDIA_PATH) == 0:
                    just_type = "media"
                    just_id = filename   # Need full path for media files
                else:
                    continue    # Not a file we're tracking commitdates for
                filename_to_commit_date[just_file] = date
                type_id_to_commit_date[just_type + "_" + just_id] = date
            else:
                continue
    # print(str(filename_to_commit_date))
    # print(str(type_id_to_commit_date))
    # Now walk the repo, find all panda files without commit dates,
    # and add commitdate to each photo that needs one
    for file_path in [MEDIA_PATH, PANDA_PATH, ZOO_PATH]:
        section = None
        for section_name in ["media", "zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                photo_list = PhotoFile(section, path)
                if photo_list.get_field("commitdate") == None:
                    if filename not in filename_to_commit_date:
                        # file's name was changed at some point
                        just_file = filename.split("/").pop()
                        just_type = None
                        just_id = None
                        if path.find(PANDA_PATH) == 0:
                            just_type = "panda"
                            just_id = just_file.split("_")[0]
                        elif path.find(ZOO_PATH) == 0:
                            just_type = "zoo"
                            just_id = just_file.split("_")[0]
                        elif path.find(MEDIA_PATH) == 0:
                            just_type = "media"
                            just_id = path   # Need full path for media files
                        else:
                            continue    # Not a file we're tracking commitdates for
                        just_key = just_type + "_" + just_id
                        if just_key not in type_id_to_commit_date:
                            print("warning: %s commitdate undetermined" % filename)
                            continue
                        else:
                            date = type_id_to_commit_date[just_key]
                            photo_list.set_field("commitdate", date)
                    else:
                        date = filename_to_commit_date[filename]
                        photo_list.set_field("commitdate", date)
                    photo_list.update_file()

def update_photo_commit_dates(starting_commit):
    """
    The old redpandafinder update logic only worked on the basis of commits
    in the last week or so. When files are re-sorted, added, or removed for
    periods of time, it becomes meaningful to search the entire git repo,
    find when a photo URI first appeared, and then track it using its first
    commit-date into redpandafinder.
    """
    uri_to_commit_date = {}
    repo = git.Repo(".")
    # List of sha1-name commits from the repo, oldest to newest
    commit_list = list(reversed(list(map(lambda x: x.hexsha, repo.iter_commits()))))
    if starting_commit != None:
        try:
            index = commit_list.index(starting_commit)
        except IndexError as e:
            raise CommitError("%s not a valid commit in this repo." % starting_commit)
        commit_list = commit_list[index:]   # All after, and including the given commit
    for index, commitish in enumerate(commit_list):
        # End of the commit list? Call it a day
        if commitish == commit_list[len(commit_list) - 1]:
            break
        # Get the diff
        start = commitish
        end = commit_list[index + 1] 
        diff_raw = repo.git.diff(start, end, 
                                 ignore_blank_lines=True,
                                 ignore_space_at_eol=True)
        patch = PatchSet(diff_raw)
        for change in patch:
            filename = change.path
            if filename.find(".txt") == -1:
                # Don't care about non-data files
                continue
            elif change.added <= 0:
                # No lines were added, so we don't care
                continue
            else:
                for hunk in change:
                    for line in hunk:
                        if line.is_added:
                            if re.match("photo.\d+:", line.value) == None:
                                # Not a photo line
                                continue
                            if line.value.find(": ") == -1:
                                # No correct delimiter, which we see in old commits
                                continue
                            if len(line.value.strip().split(": ")) != 2:
                                # Probably bad linebreaks
                                continue
                            [key, value] = line.value.strip().split(": ")
                            if (value in uri_to_commit_date):
                                # Photo we've already seen
                                continue
                            if (value.find("http") != 0):
                                # Not a URI, so not a photo reference
                                continue
                            dt = repo.commit(end).committed_datetime
                            date = str(dt.year) + "/" + str(dt.month) + "/" + str(dt.day)
                            if value not in uri_to_commit_date:
                                # Only insert a comit date once
                                uri_to_commit_date[value] = date
    # print(str(uri_to_commit_date))
    # Now walk the repo, find all files with photo lines that have no commit dates,
    # and add commitdate to each photo that needs one
    for file_path in [PANDA_PATH, ZOO_PATH, MEDIA_PATH]:
        section = None
        for section_name in ["media", "zoos", "pandas"]:
            if section_name in file_path.split("/"):
                section = section_name.split("s")[0]   # HACK
        # Enter the pandas subdirectories
        for root, dirs, files in os.walk(file_path):
            for filename in files:
                path = root + os.sep + filename
                # print(path)
                photo_list = PhotoFile(section, path)
                photo_count = photo_list.photo_count()
                photo_index = 1
                while (photo_index <= photo_count):
                    photo_option = "photo." + str(photo_index)
                    photo_uri = photo_list.get_field(photo_option)
                    date_option = photo_option + ".commitdate"
                    if photo_uri not in uri_to_commit_date:
                        photo_index = photo_index + 1
                        continue
                    date_value = uri_to_commit_date[photo_uri]
                    photo_list.set_field(date_option, date_value)
                    # print(photo_uri + " ==> " + date_value)
                    photo_index = photo_index + 1
                photo_list.update_file()

if __name__ == '__main__':
    """Choose a utility function."""
    if len(sys.argv) == 2:
        if sys.argv[1] == "--sort-instagram-updates":
            sort_ig_updates()
        if sys.argv[1] == "--update-commit-dates":
            update_entity_commit_dates(None)
            update_photo_commit_dates(None)
        if sys.argv[1] == "--deduplicate-photo-uris":
            remove_duplicate_photo_uris_per_file()
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
        if sys.argv[1] == "--update-commit-dates":
            commitish = sys.argv[2]
            update_entity_commit_dates(commitish)
            update_photo_commit_dates(commitish)
    if len(sys.argv) == 4:
        if sys.argv[1] == "--remove-photo":
            file_path = sys.argv[2]
            photo_id = sys.argv[3]
            remove_photo_from_file(file_path, photo_id)
        if sys.argv[1] == "--restore-author":
            author = sys.argv[2]
            commit = sys.argv[3]
            restore_author_to_lineage(author, commit)

