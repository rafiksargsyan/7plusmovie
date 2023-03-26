output "test_object_path" {
  value = aws_s3_object.test_object.key
}

output "ddb_movie_table_name" {
  value = aws_dynamodb_table.movie.name
}

output "ddb_movie_table_stream_arn" {
  value = aws_dynamodb_table.movie.stream_arn
}

output "ddb_cf_distro_metadata_table_name" {
  value = aws_dynamodb_table.cloudfront_distro_metadata.name
}

output "secret_manager_secret_id" {
  value = aws_secretsmanager_secret.secrets.name
}

output "media_assets_s3_bucket_name" {
  value = aws_s3_bucket.media_assets.bucket
}
