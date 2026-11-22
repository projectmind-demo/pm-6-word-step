CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT NOT NULL UNIQUE,
  japanese TEXT NOT NULL,
  chinese TEXT NOT NULL,
  phonetic TEXT NOT NULL,
  example TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_words (
  identity TEXT NOT NULL,
  study_date TEXT NOT NULL,
  word_id INTEGER NOT NULL REFERENCES words(id),
  position INTEGER NOT NULL,
  learned INTEGER NOT NULL DEFAULT 0 CHECK (learned IN (0, 1)),
  PRIMARY KEY (identity, study_date, word_id),
  UNIQUE (identity, study_date, position)
);

CREATE TABLE IF NOT EXISTS study_days (
  identity TEXT NOT NULL,
  study_date TEXT NOT NULL,
  checked_in INTEGER NOT NULL DEFAULT 0 CHECK (checked_in IN (0, 1)),
  completed_at TEXT,
  PRIMARY KEY (identity, study_date)
);

CREATE TABLE IF NOT EXISTS test_results (
  identity TEXT NOT NULL,
  study_date TEXT NOT NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  completed_at TEXT NOT NULL,
  PRIMARY KEY (identity, study_date)
);

INSERT OR IGNORE INTO words (english, japanese, chinese, phonetic, example) VALUES
  ('achieve', '達成する', '实现；达到', '/əˈtʃiːv/', 'She worked hard to achieve her goal.'),
  ('admire', '感心する、称賛する', '钦佩；赞赏', '/ədˈmaɪər/', 'I admire her courage.'),
  ('advance', '進歩する、進める', '前进；进步', '/ədˈvæns/', 'Technology continues to advance.'),
  ('anxious', '心配して、切望して', '焦虑的；渴望的', '/ˈæŋkʃəs/', 'He felt anxious before the exam.'),
  ('benefit', '利益、恩恵', '益处；受益', '/ˈbenɪfɪt/', 'Exercise has many health benefits.'),
  ('challenge', '挑戦、課題', '挑战；难题', '/ˈtʃælɪndʒ/', 'Every challenge is a chance to learn.'),
  ('communicate', '意思を伝える', '交流；沟通', '/kəˈmjuːnɪkeɪt/', 'We communicate by email.'),
  ('concentrate', '集中する', '集中；专心', '/ˈkɑːnsəntreɪt/', 'Please concentrate on your work.'),
  ('consider', 'よく考える、考慮する', '考虑；认为', '/kənˈsɪdər/', 'Please consider my suggestion.'),
  ('contribute', '貢献する', '贡献；投稿', '/kənˈtrɪbjuːt/', 'Everyone can contribute to the project.'),
  ('convenient', '便利な', '方便的', '/kənˈviːniənt/', 'The new store is very convenient.'),
  ('decrease', '減少する', '减少；降低', '/dɪˈkriːs/', 'The price may decrease next month.'),
  ('delight', '大いに喜ばせる、喜び', '使高兴；喜悦', '/dɪˈlaɪt/', 'The gift was a great delight.'),
  ('depend', '頼る、次第である', '依靠；取决于', '/dɪˈpend/', 'Success depends on your effort.'),
  ('determine', '決定する、決心する', '决定；确定', '/dɪˈtɜːrmɪn/', 'We need to determine the cause.'),
  ('encounter', '遭遇する、出会い', '遇到；邂逅', '/ɪnˈkaʊntər/', 'You may encounter new problems.'),
  ('environment', '環境', '环境', '/ɪnˈvaɪrənmənt/', 'We should protect the environment.'),
  ('essential', '不可欠な、本質的な', '必要的；本质的', '/ɪˈsenʃəl/', 'Water is essential for life.'),
  ('familiar', 'よく知っている、なじみのある', '熟悉的', '/fəˈmɪliər/', 'Her face looks familiar.'),
  ('generous', '寛大な、気前のよい', '慷慨的；大方的', '/ˈdʒenərəs/', 'He is generous with his time.'),
  ('hesitate', 'ためらう', '犹豫', '/ˈhezɪteɪt/', 'Do not hesitate to ask questions.'),
  ('identify', '特定する、確認する', '识别；确认', '/aɪˈdentɪfaɪ/', 'Can you identify this bird?'),
  ('influence', '影響を与える、影響', '影响', '/ˈɪnfluəns/', 'Music can influence our mood.'),
  ('maintain', '維持する', '维持；保养', '/meɪnˈteɪn/', 'It is difficult to maintain focus.'),
  ('opportunity', '機会', '机会', '/ˌɑːpərˈtuːnəti/', 'This is a good opportunity to practice.'),
  ('persuade', '説得する', '说服', '/pərˈsweɪd/', 'She persuaded me to try again.'),
  ('prevent', '防ぐ', '防止；预防', '/prɪˈvent/', 'Sleep can prevent many problems.'),
  ('require', '必要とする、要求する', '需要；要求', '/rɪˈkwaɪər/', 'This task requires patience.'),
  ('respond', '返答する、反応する', '回答；回应', '/rɪˈspɑːnd/', 'Please respond to the message.'),
  ('volunteer', 'ボランティアをする、志願者', '志愿；志愿者', '/ˌvɑːlənˈtɪr/', 'She volunteers at the library.');
