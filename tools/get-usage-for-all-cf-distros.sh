#/bin/sh

get_usage_for_cf_distro() {
  ASSUME_ROLE_RESPONSE=$(aws sts assume-role --role-arn $1 --role-session-name GetCFDistroUsage --region eu-west-3 --profile q62-prod)

  export AWS_ACCESS_KEY_ID=$(jq -r '.Credentials.AccessKeyId' <<<$ASSUME_ROLE_RESPONSE)
  export AWS_SECRET_ACCESS_KEY=$(jq -r '.Credentials.SecretAccessKey' <<<$ASSUME_ROLE_RESPONSE)
  export AWS_SESSION_TOKEN=$(jq -r '.Credentials.SessionToken' <<<$ASSUME_ROLE_RESPONSE)

  START_TIME=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" $(date +"%Y-%m-%1T%H:%M:%SZ" | sed 's/T.*Z/T00:00:00Z/') "+%s")
  END_TIME=$(date +%s)

  BYTES=$(aws cloudwatch get-metric-statistics --namespace AWS/CloudFront --metric-name BytesDownloaded --dimensions Name=DistributionId,Value=$2 Name=Region,Value=Global  --start-time $START_TIME --end-time $END_TIME --period 86400 --statistics Sum --region us-east-1 | jq ".Datapoints" | jq "[.[] | .Sum]" | jq 'add')

  echo "scale=2; $BYTES / 1024 / 1024 / 1024" | bc
}

CF_DISTROS_JSON_FILE=$1
NUM_DISTROS=$(jq 'length' < $CF_DISTROS_JSON_FILE)

for ((i=0;i<$NUM_DISTROS;++i)) do
  ASSUME_ROLE=$(cat $CF_DISTROS_JSON_FILE | jq -r ".[$i].assume_role_arn_for_main_account")
  CF_ARN=$(cat $CF_DISTROS_JSON_FILE | jq -r ".[$i].cf_arn")
  CF_DISTRO_ID=$(echo $CF_ARN | grep -o 'distribution/.*' | sed 's/distribution\///g')
  get_usage_for_cf_distro $ASSUME_ROLE $CF_DISTRO_ID
done

