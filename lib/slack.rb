require 'net/http'

def notify_slack(text)
  puts text
  return if ENV["SLACK_URL"].nil?
  uri = URI.parse(ENV["SLACK_URL"])
  https = Net::HTTP.new(uri.host, uri.port)
  https.use_ssl = true
  req = Net::HTTP::Post.new(uri.request_uri)
  req["Content-Type"] = "application/json"
  req.body = "{ \"text\": \"#{text}\" }"
  response = https.request(req)
  response
end
