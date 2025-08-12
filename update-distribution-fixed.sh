#!/bin/bash

source cloudfront-info.env

# Get current distribution config and ETag
ETAG=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'ETag' --output text)
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --query 'DistributionConfig' > current-config.json

# Update the config with custom domain and SSL
jq --arg cert_arn "$CERT_ARN" '
.Aliases = {
  "Quantity": 1,
  "Items": ["collections.cloudcontactai.com"]
} |
.ViewerCertificate = {
  "ACMCertificateArn": $cert_arn,
  "SSLSupportMethod": "sni-only",
  "MinimumProtocolVersion": "TLSv1.2_2021"
}' current-config.json > updated-config.json

echo "Updating CloudFront distribution with custom domain..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://updated-config.json --if-match $ETAG

if [ $? -eq 0 ]; then
    echo "Distribution updated successfully!"
    echo "Create CNAME record: collections.cloudcontactai.com -> $CLOUDFRONT_DOMAIN"
else
    echo "Update failed. Check certificate validation status."
fi