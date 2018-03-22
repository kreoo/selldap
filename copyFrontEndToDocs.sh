rsync -r ./build_webpack/ ./docs/
git add .
git commit -m "recompile of front end added to docs"
git push -u origin master
