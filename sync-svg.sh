#!/bin/bash
echo "Syncing svgs...."
sudo rsync -azv -e "ssh" --progress root@beta.arasaac.org:/data/arasaac-docker/newarasaac/svg/ $HOME/arasaac-docker/newarasaac/svg/
