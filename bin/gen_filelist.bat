net use z: \\HAP-Z1ES\HAP_Internal
net use y: \\HAP-Z1ES\HAP_External

cd /d z:
DIR /S /B /A-D >e:\hub\internal.txt

cd /d y:
DIR /S /B /A-D >e:\hub\external.txt

cd /d e:\hub

node bin\upload_tracks

net use z: /delete
net use y: /delete
