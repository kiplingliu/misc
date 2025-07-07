# Make a folder %AppData%\Anki2\addons21\find_duplicate_fields and put this file in
from aqt import mw
from aqt.qt import QAction
from aqt.utils import showInfo
from aqt.browser import Browser
from anki.collection import Collection
from bs4 import BeautifulSoup

def get_raw_text(html_content):
    """Extract raw text from HTML content, ignoring formatting."""
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text().strip()

def find_duplicate_fields():
    # Get the current collection
    col = mw.col

    deck_name = "JP::Vocab"
    deck_notes = col.find_notes(f"deck:{deck_name}")

    # Define the fields to compare (change these to your field names)
    field1 = "Expression"
    field2 = "Sentence"

    # Store note IDs with duplicate fields
    duplicate_note_ids = set()

    # Iterate through all notes in the collection
    for note_id in deck_notes:
        note = col.get_note(note_id)

        # Get the raw text of the fields
        field1_text = get_raw_text(note[field1])
        field2_text = get_raw_text(note[field2])

        # Check if the raw text of the two fields is the same
        if field1_text == field2_text:
            duplicate_note_ids.add(note.id)

    # Show results
    if duplicate_note_ids:
        # Convert note IDs to a comma-separated string for the search bar
        note_ids_str = "nid:" + ",".join(str(note_id) for note_id in duplicate_note_ids)

        # Open the Browse window with the search string populated
        browser = Browser(mw)
        browser.setFilter(f"deck:{deck_name} " + note_ids_str)
        browser.show()
    else:
        showInfo(f"No notes found with duplicate raw text in '{field1}' and '{field2}'.")

# Add a menu item to Anki
action = QAction("Find Duplicate Fields", mw)
action.triggered.connect(find_duplicate_fields)
mw.form.menuTools.addAction(action)
