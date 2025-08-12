#!/bin/bash

# Load distribution info
source cloudfront-info.env

echo "Setting up SSL certificate and custom domain..."

# Request SSL certificate (must be in us-east-1 for CloudFront)
echo "Requesting SSL certificate for collections.cloudcontactai.com..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name collections.cloudcontactai.com \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

echo "Certificate ARN: $CERT_ARN"
echo "Please validate the certificate via DNS before proceeding."
echo ""
echo "To check certificate status:"
echo "aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1"
echo ""
echo "Once validated, update CloudFront distribution:"
echo "aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://cloudfront-config-with-ssl.json"

# Create updated config with SSL
cat > cloudfront-config-with-ssl.json << EOF
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

echo "CERT_ARN=$CERT_ARN" >> cloudfront-info.env