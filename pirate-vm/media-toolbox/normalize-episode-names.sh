#!/bin/bash

REGEX=".*[s,S][0]*([1-9]+[0-9]*)[e,E][0]*([1-9]+[0-9]*).*"
for f in *; do
  extension="${f##*.}"
  name="${f%.*}"
  if [[ $name =~ $REGEX ]]
  then
    season="${BASH_REMATCH[1]}"
    episode="${BASH_REMATCH[2]}"
    touch ${episode}.${extension}
    mv $f ${episode}.${extension}
  fi
done
