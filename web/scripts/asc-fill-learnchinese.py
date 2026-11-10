#!/usr/bin/env python3
"""Fill App Store Connect metadata for LearnChinese Today (no Submit)."""
from __future__ import annotations

import json
import pathlib
import time
import urllib.error
import urllib.request
from typing import Any, Optional

from cryptography.hazmat.primitives.serialization import load_pem_private_key
from jwt import encode

APP_ID = "6832237621"
VERSION_ID = "9c9f7755-3427-4058-8d63-72f039030486"
ISSUE = "397a132e-8965-42b3-aa81-cdc149a023d0"
KEY_ID = "AZQNT38TJQ"
KEY_PATH = pathlib.Path(
    "/Users/ianthomaz/Documents/Projects/blackair/_credentials/apple/AuthKey_AZQNT38TJQ.p8"
)
SHOT_DIR = pathlib.Path(
    "/Users/ianthomaz/Projects/chineseLearning/appMobile/store/screenshots/iphone-67"
)

DESCRIPTION = """LearnChinese Today helps you practice Mandarin every day — on your phone and on the Lock Screen.

Free app: 己欲立而立人，己欲达而达人  

Sign in required (same account as learnchinese.today): Apple, Google, email, or Alipay. Third-party sign-in creates your account immediately so progress and preferences sync across the website and the phone.

• Hanzi Memorize widget — a character or compound on a timer
• Phrase Puzzle — build real sentences with HSK vocabulary
• Vocabulary — practise hanzi, context decks, and browse by topic
• Progress — rounds sync to your account on the site"""

WHATS_NEW = "1.0 — Fresh release. Sign-in required; Vocabulary includes hanzi practice. Free!"
PROMO = "Free Mandarin practice: phrase puzzles, vocabulary with hanzi, Lock Screen widget. Same account as learnchinese.today."
KEYWORDS = "chinese,mandarin,hanzi,pinyin,hsk,flashcards,phrases,learn"
SUBTITLE = "Learn Chinese games + widget"
SUPPORT = "https://learnchinese.today/"
MARKETING = "https://learnchinese.today/"
PRIVACY = "https://learnchinese.today/privacy"
COPYRIGHT = "2026 webplace.cc (ITCS webplace LTDA - Brazil)"
REVIEW_NOTES = """LearnChinese Today requires sign-in (same account as learnchinese.today).

There is no username/password demo account for App Review.
Sign-in is via third-party providers only on the review path we recommend:
use Sign in with Apple with your own Apple ID (free; account is created immediately).
Google and Alipay also work; Alipay needs the Alipay app on the device.

The account exists so progress and preferences sync across the website and the phone.
The app is free — no in-app purchases, no subscription.

After sign-in: phrase practice, vocabulary / hanzi study, progress sync, and an
optional Home / Lock Screen widget (study content only while signed in).

No Game Center."""

CONTACT_EMAIL = "email@learnchinese.today"
CONTACT_PHONE = "+5511991051388"
CONTACT_FIRST = "Ian"
CONTACT_LAST = "Thomaz"

_pk = load_pem_private_key(KEY_PATH.read_bytes(), password=None)


def token() -> str:
    now = int(time.time())
    return encode(
        {
            "iss": ISSUE,
            "iat": now,
            "exp": now + 1170,
            "aud": "appstoreconnect-v1",
        },
        _pk,
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


def api(method: str, path: str, body: Any = None, retries: int = 4) -> tuple[int, Any]:
    data = None if body is None else json.dumps(body).encode()
    last_err: Optional[Exception] = None
    for attempt in range(retries):
        req = urllib.request.Request(
            "https://api.appstoreconnect.apple.com" + path,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {token()}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                raw = resp.read()
                return resp.status, (json.loads(raw) if raw else None)
        except urllib.error.HTTPError as e:
            err = e.read().decode()
            try:
                parsed = json.loads(err) if err else None
            except json.JSONDecodeError:
                parsed = {"raw": err}
            if e.code in (409, 422) or attempt == retries - 1:
                return e.code, parsed
            time.sleep(1.5 * (attempt + 1))
            last_err = e
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"ASC API failed {method} {path}: {last_err}")


def log(msg: str) -> None:
    print(msg, flush=True)


def patch_version_copyright() -> None:
    st, _ = api(
        "PATCH",
        f"/v1/appStoreVersions/{VERSION_ID}",
        {
            "data": {
                "type": "appStoreVersions",
                "id": VERSION_ID,
                "attributes": {
                    "copyright": COPYRIGHT,
                    "releaseType": "AFTER_APPROVAL",
                },
            }
        },
    )
    log(f"copyright/releaseType → {st}")


def ensure_version_localization() -> str:
    st, d = api("GET", f"/v1/appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations")
    locs = (d or {}).get("data") or []
    en = next((x for x in locs if x["attributes"].get("locale") == "en-US"), None)
    if not en:
        st, d = api(
            "POST",
            "/v1/appStoreVersionLocalizations",
            {
                "data": {
                    "type": "appStoreVersionLocalizations",
                    "attributes": {"locale": "en-US"},
                    "relationships": {
                        "appStoreVersion": {
                            "data": {"type": "appStoreVersions", "id": VERSION_ID}
                        }
                    },
                }
            },
        )
        log(f"create en-US localization → {st}")
        en = (d or {}).get("data")
    assert en, "no en-US localization"
    loc_id = en["id"]
    st, _ = api(
        "PATCH",
        f"/v1/appStoreVersionLocalizations/{loc_id}",
        {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": {
                    "description": DESCRIPTION,
                    "keywords": KEYWORDS,
                    "marketingUrl": MARKETING,
                    "promotionalText": PROMO,
                    "supportUrl": SUPPORT,
                    "whatsNew": WHATS_NEW,
                },
            }
        },
    )
    log(f"version localization texts → {st} id={loc_id}")
    return loc_id


def ensure_review_detail() -> None:
    st, d = api("GET", f"/v1/appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
    detail = (d or {}).get("data")
    attrs = {
        "contactEmail": CONTACT_EMAIL,
        "contactFirstName": CONTACT_FIRST,
        "contactLastName": CONTACT_LAST,
        "contactPhone": CONTACT_PHONE,
        "demoAccountRequired": False,
        "notes": REVIEW_NOTES,
    }
    if detail:
        st, _ = api(
            "PATCH",
            f"/v1/appStoreReviewDetails/{detail['id']}",
            {
                "data": {
                    "type": "appStoreReviewDetails",
                    "id": detail["id"],
                    "attributes": attrs,
                }
            },
        )
        log(f"patch review detail → {st}")
    else:
        st, _ = api(
            "POST",
            "/v1/appStoreReviewDetails",
            {
                "data": {
                    "type": "appStoreReviewDetails",
                    "attributes": attrs,
                    "relationships": {
                        "appStoreVersion": {
                            "data": {"type": "appStoreVersions", "id": VERSION_ID}
                        }
                    },
                }
            },
        )
        log(f"create review detail → {st}")


def ensure_app_info_localization_and_category() -> None:
    st, d = api("GET", f"/v1/apps/{APP_ID}/appInfos")
    infos = (d or {}).get("data") or []
    # Prefer the editable one for the prepare version
    info = None
    for ai in infos:
        state = (ai.get("attributes") or {}).get("appStoreState") or (ai.get("attributes") or {}).get(
            "state"
        )
        log(f"appInfo {ai['id']} attrs={ai.get('attributes')}")
        if state in (None, "PREPARE_FOR_SUBMISSION", "READY_FOR_SALE", "WAITING_FOR_REVIEW") or len(infos) == 1:
            info = ai
    if not info and infos:
        info = infos[0]
    assert info, "no appInfo"
    info_id = info["id"]

    # subtitle / privacy on appInfoLocalization
    st, d = api("GET", f"/v1/appInfos/{info_id}/appInfoLocalizations")
    locs = (d or {}).get("data") or []
    en = next((x for x in locs if x["attributes"].get("locale") == "en-US"), None)
    if not en:
        st, d = api(
            "POST",
            "/v1/appInfoLocalizations",
            {
                "data": {
                    "type": "appInfoLocalizations",
                    "attributes": {"locale": "en-US", "name": "LearnChinese Today"},
                    "relationships": {
                        "appInfo": {"data": {"type": "appInfos", "id": info_id}}
                    },
                }
            },
        )
        log(f"create appInfoLocalization → {st}")
        en = (d or {}).get("data")
    assert en
    st, _ = api(
        "PATCH",
        f"/v1/appInfoLocalizations/{en['id']}",
        {
            "data": {
                "type": "appInfoLocalizations",
                "id": en["id"],
                "attributes": {
                    "name": "LearnChinese Today",
                    "subtitle": SUBTITLE,
                    "privacyPolicyUrl": PRIVACY,
                },
            }
        },
    )
    log(f"appInfoLocalization subtitle/privacy → {st}")

    # primary category EDUCATION
    st, cats = api("GET", "/v1/appCategories?filter[platforms]=IOS&limit=200")
    education = None
    for c in (cats or {}).get("data") or []:
        if c["attributes"].get("name") == "Education" or c["id"] == "EDUCATION":
            education = c
            break
    if not education:
        # Apple uses ids like EDUCATION
        education = {"id": "EDUCATION", "type": "appCategories"}
    st, _ = api(
        "PATCH",
        f"/v1/appInfos/{info_id}",
        {
            "data": {
                "type": "appInfos",
                "id": info_id,
                "relationships": {
                    "primaryCategory": {
                        "data": {"type": "appCategories", "id": education["id"]}
                    }
                },
            }
        },
    )
    log(f"primaryCategory Education → {st} ({education['id']})")


def ensure_content_rights() -> None:
    # contentRightsDeclaration on app
    st, _ = api(
        "PATCH",
        f"/v1/apps/{APP_ID}",
        {
            "data": {
                "type": "apps",
                "id": APP_ID,
                "attributes": {
                    "contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT",
                },
            }
        },
    )
    log(f"contentRightsDeclaration → {st}")


def upload_screenshots(loc_id: str) -> None:
    st, d = api(
        "GET",
        f"/v1/appStoreVersionLocalizations/{loc_id}/appScreenshotSets",
    )
    sets = (d or {}).get("data") or []
    shot_set = next(
        (s for s in sets if s["attributes"].get("screenshotDisplayType") == "APP_IPHONE_67"),
        None,
    )
    if not shot_set:
        st, d = api(
            "POST",
            "/v1/appScreenshotSets",
            {
                "data": {
                    "type": "appScreenshotSets",
                    "attributes": {"screenshotDisplayType": "APP_IPHONE_67"},
                    "relationships": {
                        "appStoreVersionLocalization": {
                            "data": {
                                "type": "appStoreVersionLocalizations",
                                "id": loc_id,
                            }
                        }
                    },
                }
            },
        )
        log(f"create APP_IPHONE_67 set → {st}")
        shot_set = (d or {}).get("data")
    assert shot_set, "no screenshot set"
    set_id = shot_set["id"]

    # Clear existing screenshots in set (replace with our 6)
    st, d = api("GET", f"/v1/appScreenshotSets/{set_id}/appScreenshots")
    for old in (d or {}).get("data") or []:
        api("DELETE", f"/v1/appScreenshots/{old['id']}")
        log(f"deleted old screenshot {old['id']}")

    files = [
        "01-signin.png",
        "02-home.png",
        "03-phrases.png",
        "04-vocabulary.png",
        "05-study.png",
        "06-progress.png",
    ]
    for name in files:
        path = SHOT_DIR / name
        raw = path.read_bytes()
        st, d = api(
            "POST",
            "/v1/appScreenshots",
            {
                "data": {
                    "type": "appScreenshots",
                    "attributes": {
                        "fileName": name,
                        "fileSize": len(raw),
                    },
                    "relationships": {
                        "appScreenshotSet": {
                            "data": {"type": "appScreenshotSets", "id": set_id}
                        }
                    },
                }
            },
        )
        if st not in (200, 201) or not d or not d.get("data"):
            log(f"reserve {name} failed → {st} {d}")
            continue
        shot = d["data"]
        shot_id = shot["id"]
        ops = shot["attributes"].get("uploadOperations") or []
        for op in ops:
            url = op["url"]
            method = op.get("method", "PUT")
            headers = {h["name"]: h["value"] for h in op.get("requestHeaders") or []}
            offset = op.get("offset", 0)
            length = op.get("length", len(raw))
            chunk = raw[offset : offset + length]
            req = urllib.request.Request(url, data=chunk, method=method, headers=headers)
            with urllib.request.urlopen(req, timeout=120) as resp:
                log(f"upload {name} chunk → {resp.status}")
        st, _ = api(
            "PATCH",
            f"/v1/appScreenshots/{shot_id}",
            {
                "data": {
                    "type": "appScreenshots",
                    "id": shot_id,
                    "attributes": {
                        "uploaded": True,
                        "sourceFileChecksum": __import__("hashlib")
                        .md5(raw)
                        .hexdigest(),
                    },
                }
            },
        )
        log(f"commit {name} → {st}")


def main() -> None:
    log("=== ASC fill LearnChinese Today (no submit) ===")
    patch_version_copyright()
    loc_id = ensure_version_localization()
    ensure_review_detail()
    ensure_app_info_localization_and_category()
    ensure_content_rights()
    upload_screenshots(loc_id)
    log("=== done (Submit NOT requested) ===")


if __name__ == "__main__":
    main()
