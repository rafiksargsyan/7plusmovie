#!/bin/bash

REGEX1=".*[s,S][0]*([1-9]+[0-9]*)[e,E][0]*([1-9]+[0-9]*).*"
REGEX2="[0]*([1-9]+[0-9]*)\..*"
REGEX3=".*[0]*([1-9]+[0-9]*)[x,X][0]*([1-9]+[0-9]*).*"
for f in *; do
  extension="${f##*.}"
  name="${f%.*}"
  if [[ $name =~ $REGEX1 ]]
  then
    season="${BASH_REMATCH[1]}"
    episode="${BASH_REMATCH[2]}"
    touch ${episode}.${extension}
    mv "$f" ${episode}.${extension}
  elif [[ $name =~ $REGEX2 ]]
  then
    episode="${BASH_REMATCH[1]}"
    touch ${episode}.${extension}
    mv "$f" ${episode}.${extension}
  elif [[ $name =~ $REGEX3 ]]
  then
    episode="${BASH_REMATCH[2]}"
    touch ${episode}.${extension}
    mv "$f" ${episode}.${extension}
  fi
done
