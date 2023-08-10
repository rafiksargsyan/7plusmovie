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

output "admin_user_pool_arn" {
  value = aws_cognito_user_pool.admin_user_pool.arn
}

output "admin_user_pool_cli_client_id" {
  value = aws_cognito_user_pool_client.admin_client_cli.id
}

output "raw_media_assets_s3_bucket_name" {
  value = aws_s3_bucket.raw_media_assets.bucket
}

output "ddb_movie_transcoding_job_table_stream_arn" {
  value = aws_dynamodb_table.movie_transcoding_job.stream_arn
}

output "ddb_movie_transcoding_job_table_name" {
  value = aws_dynamodb_table.movie_transcoding_job.name
}

output "ddb_transcoding_job_table_stream_arn" {
  value = aws_dynamodb_table.transcoding_job.stream_arn
}

output "ddb_transcoding_job_table_name" {
  value = aws_dynamodb_table.transcoding_job.name
}

output "secret_manager_transcoding_context_secret_id" {
  value = aws_secretsmanager_secret.transcoding_context_secrets.name
}