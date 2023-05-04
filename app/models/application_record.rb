class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  def as_error_json
    {
      errors: errors,
      reason: errors.full_messages.join(",")
    }
  end

  def self.google_drive_session(client_id, client_secret, refresh_token)
    credentials = Google::Auth::UserRefreshCredentials.new(
      client_id: client_id,
      client_secret: client_secret,
      scope: %w(https://www.googleapis.com/auth/drive https://spreadsheets.google.com/feeds/),
      redirect_uri: 'http://example.com/redirect'
    )
    credentials.refresh_token = refresh_token
    credentials.fetch_access_token!
    GoogleDrive::Session.from_credentials(credentials)
  end

  def self.google_drive_wordsheet(sheet_id, title)
    session = google_drive_session(
      ENV.fetch('GOOGLE_DRIVE_CLIENT_ID'),
      ENV.fetch('GOOGLE_DRIVE_CLIENT_SECRET'),
      ENV.fetch('GOOGLE_DRIVE_REFRESH_TOKEN')
    )
    sp = session.spreadsheet_by_key(sheet_id)
    sp.worksheet_by_title(title)
  end

  def self.ws2hashes(ws)
    return [] if ws.nil?
    keys = 1.step.take_while { |i|  ws[1, i] != ""}.map { |i| ws[1, i] }
    (2..ws.max_rows).map do |j|
      (0...keys.count).each_with_object({}) do |i, memo|
        value = ws[j, i + 1]
        case keys[i]
        when /id$/
          value = value == "" ? nil : value.to_i
        end
        value = nil if value == ""
        memo.merge!(keys[i] => value)
      end
    end
  end
end
