#!/bin/bash

if test -f ".env"; then
  echo ".env exists."
else
  cp .envTemplate .env
fi


# build vue app
npm run build


# upload to cloudfront
if [[ $1 == "prod" ]]; then

  echo "** Uploaded to prod s3 bucket **"
  aws s3 rm s3://static.iobio.io/prod/rnasplice.iobio.io/assets/ --recursive
  aws s3 cp ./dist/  s3://static.iobio.io/prod/rnasplice.iobio.io/ --recursive
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id E21P17I3OQG601 --paths /\*

# upload to cloudfront
elif [[ $1 == "stage" ]]; then

  echo "** Uploaded to stage s3 bucket **"
  aws s3 rm s3://static.iobio.io/stage/rnasplice.iobio.io/assets/ --recursive
  aws s3 cp ./dist/  s3://static.iobio.io/stage/rnasplice.iobio.io/ --recursive
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id E1QTNXGVER3ZJT --paths /\*

else
  echo "** Syncing to dev s3 bucket **"
  aws s3 rm s3://static.iobio.io/dev/rnasplice.iobio.io/assets/ --recursive
  aws s3 cp  ./dist/  s3://static.iobio.io/dev/rnasplice.iobio.io/ --recursive
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id ???? --paths /\*
fi
