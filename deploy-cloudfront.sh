#!/bin/bash

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --query 'Distribution.Id' --output text)

if [ $? -eq 0 ]; then
    echo "CloudFront distribution created successfully!"
    echo "Distribution ID: $DISTRIBUTION_ID"
    
    # Get the CloudFront domain name
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)
    echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
    
    echo ""
    echo "Next steps:"
    echo "1. Wait for distribution to deploy (15-20 minutes)"
    echo "2. Create SSL certificate for collections.cloudcontactai.com in AWS Certificate Manager"
    echo "3. Update the distribution to use the SSL certificate"
    echo "4. Create CNAME record: collections.cloudcontactai.com -> $CLOUDFRONT_DOMAIN"
    
    # Save distribution info
    echo "DISTRIBUTION_ID=$DISTRIBUTION_ID" > cloudfront-info.env
    echo "CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN" >> cloudfront-info.env
    
else
    echo "Failed to create CloudFront distribution"
    exit 1
fi