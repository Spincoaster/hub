DIR=`pwd`

echo "Start creating internal.txt"

pushd /Volumes/HAP_Internal
find . > $DIR/internal.txt
popd

echo "Created internal.txt"


echo "Start creating external.txt"

pushd /Volumes/HAP_External
find . > $DIR/external.txt
popd

echo "Created external.txt"
