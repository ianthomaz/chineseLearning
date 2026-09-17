#!/usr/bin/env bash
# Canonical route lists for live QA. Source after lib.sh.

qa_public_pages() {
  cat <<'EOF'
/
/phrase-game
/ktv
/review
/vocabulary
/visuals
/grammar
/dialogues
/privacy
/terms
EOF
}

qa_gated_pages() {
  cat <<'EOF'
/practice
/tutor
/gamification
EOF
}

qa_curator_pages() {
  cat <<'EOF'
/registerClass
/reviewClass
/backoffice
EOF
}

qa_dead_pages() {
  cat <<'EOF'
/praticar
/randomhanzi
EOF
}

qa_index_pages() {
  cat <<'EOF'
/review
/vocabulary
/grammar
EOF
}

qa_crawl_seeds() {
  cat <<'EOF'
/
/phrase-game
/review
/vocabulary
/visuals
/grammar
/dialogues
/privacy
/terms
/practice
/ktv
EOF
}

qa_lighthouse_pages() {
  cat <<'EOF'
/
/phrase-game
/review
/practice
/ktv
EOF
}

qa_payload_budgets() {
  # path  max_uncompressed_bytes
  cat <<'EOF'
/ 80000
/phrase-game 60000
/practice 50000
/dialogues 220000
EOF
}
