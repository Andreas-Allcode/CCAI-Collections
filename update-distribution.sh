#!/bin/bash

source cloudfront-info.env

# Get current distribution config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --query 'DistributionConfig' > temp-config.json

# Create updated config with custom domain and SSL
cat > updated-config.json << EOF
{
  "CallerReference": "ccai-collections-cf-1754517629",
  "Aliases": {
    "Quantity": 1,
    "Items": ["collections.cloudcontactai.com"]
  },
  "DefaultRootObject": "index.html",
  "Comment": "CCAI Collections CloudFront Distribution with SSL",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "ccai-collections-s3-origin",
        "DomainName": "ccai-collections-1754517629.s3-website-us-east-1.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ccai-collections-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_100"
}
EOF

# Get ETag for update
ETAG=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'ETag' --output text)

echo "Updating CloudFront distribution with custom domain..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://updated-config.json --if-match $ETAG

echo "Distribution updated. Create CNAME record:"
echo "collections.cloudcontactai.com -> $CLOUDFRONT_DOMAIN"