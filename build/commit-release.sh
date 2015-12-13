#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

./build/require-clean-working-tree.sh

read -p "Enter the new version number with no 'v' (for example '1.0.1'): " version

if [[ ! "$version" ]]
then
	exit
fi

# will do everything necessary for a release,
# including bumping version in .json files
# TODO: if tests cancelled midway thu, should return error code and exit
gulp release --version="$version"

# save reference to current branch
orig_ref=$(git symbolic-ref -q HEAD)

# make a tagged detached commit of the dist files.
# no-verify avoids commit hooks.
# the &&'s make this an expression. won't exit on failure.
git checkout --detach --quiet && \
git add *.json && \
git add -f dist/*.js dist/*.css && \
git commit -e -m "version $version" && \
git tag -a "v$version" -m "version $version"

# if failure building the commit, there will be leftover .json changes.
# always discard. won't be harmful otherwise.
git checkout "$orig_ref" -- *.json

# go back original branch.
# need to reset so dist files are not staged.
# this will be executed regardless of whether the commit was build correctly.
git symbolic-ref HEAD "$orig_ref"
git reset
