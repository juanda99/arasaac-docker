#!/bin/bash
echo "Syncing svgs...."
sudo rsync -azv -e "ssh" --progress root@178.32.186.133:/var/arasaac-docker/newarasaac/svg/ $HOME/arasaac-docker/newarasaac/svg/
echo "Syncing pictograms..."
sudo rsync -azv -e "ssh" --progress root@178.32.186.133:/var/arasaac-docker/newarasaac/pictograms/ $HOME/arasaac-docker/newarasaac/pictograms/
echo "Syncing locutions..."
sudo rsync -azv -e "ssh" --progress root@178.32.186.133:/var/arasaac-docker/newarasaac/locutions/ $HOME/arasaac-docker/newarasaac/locutions/
echo "Syncing materials..."
sudo rsync -azv -e "ssh" --progress root@178.32.186.133:/var/arasaac-docker/newarasaac/materials/ $HOME/arasaac-docker/newarasaac/materials/
