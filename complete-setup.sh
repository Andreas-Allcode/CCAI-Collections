#!/bin/bash

source cloudfront-info.env

echo "CloudFront Distribution Created:"
echo "Distribution ID: $DISTRIBUTION_ID"
echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "Certificate ARN: $CERT_ARN"
echo ""

echo "Next steps to complete setup:"
echo ""
echo "1. Validate SSL certificate via DNS:"
echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1"
echo "   Add the DNS validation record to your domain"
echo ""
echo "2. Once certificate is validated, get current distribution config:"
echo "   aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json"
echo ""
echo "3. Update distribution with custom domain (after certificate validation):"
echo "   # This will be done automatically once certificate is validated"
echo ""
echo "4. Create DNS CNAME record:"
echo "   collections.cloudcontactai.com -> $CLOUDFRONT_DOMAIN"
echo ""
echo "Current CloudFront URL (works now): https://$CLOUDFRONT_DOMAIN"