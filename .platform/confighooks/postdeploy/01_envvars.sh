#!/bin/bash

cp /opt/elasticbeanstalk/deployment/env /opt/elasticbeanstalk/deployment/envvars
sed -i -E -n 's/[^#]+/export &/ p' /opt/elasticbeanstalk/deployment/envvars
sed -i -e 's/=/="/' /opt/elasticbeanstalk/deployment/envvars
sed -i -e 's/$/"/' /opt/elasticbeanstalk/deployment/envvars
chmod 644 /opt/elasticbeanstalk/deployment/envvars
rm -f /opt/elasticbeanstalk/deployment/*.bak
