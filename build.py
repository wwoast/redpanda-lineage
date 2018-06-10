#!/usr/bin/python3

# This Red Panda Lineage dataset builder takes all source input data and
# creates a JSON file intended for family tree querying.

import ConfigParser
import simplejson as json


def check_dates():
    """Run checks against the complete tree of red panda dates.

    - Birth date and date of death should not be reversed.
    - Child pandas should not be born before the parent.
    - Child pandas should not be born after the parent died.
    """
    pass

def check_imported_date(date):
    """Dates should all be in the form of YYYY/MM/DD."""
    pass

def check_imported_gender(gender):
    """Validate the gender string is correct.

    Allowed strings are one of: 
    m, f, M, F, male, female, オス, or メス

    The gender strings will be cast into just "Male" or "Female", so that
    the website can choose which language to display this data in.
    """
    pass

def check_imported_name(name):
    """Ensure the name strings are not longer than 80 characters.
    
    This limitation applies to zoos, pandas, and other details, and is
    intended to make text formatting simpler.
    """
    pass

def check_imported_panda_id(panda_id):
    """Validate that the ID for a panda doesn't already exist."""
    pass

def check_panda_children_ids():
    """Run checks against the complete index of red panda chilren's IDs.

    - No duplicate IDs should exist
    - The children IDs should be valid for only one red panda file
    - There should be no loops / I'm my own grandpa situations
    """
    pass

def import_redpanda(path):
    """Take a red panda file and convert it to JSON.

    Perform consistency checks on any red panda imported.
    """
    pass

def import_zoo(path):
    """Take a zoo file and convert it to JSON."""
    pass

def build_dataset():
    """Reads in all files to build a red panda dataset"""
    pass    

if __name__ == '__main__':
    """Initialize all library settings"""
    build_dataset()
