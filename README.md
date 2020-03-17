# Aavanam

Aavanam is a simple document generator for javascript with ES7 suupport.

For now, Read the example files in the folder to know how to structure your comments to generate documentation.


## Build Doc files

  npx run aavanam build -R [path to Readme file/root markdown file] -M [path to manuals folder] '[glob sepecifier of files with in quotes]'

  **eg:** npx run aavanam build -R README.md -M example/manuals example/**/*.js
