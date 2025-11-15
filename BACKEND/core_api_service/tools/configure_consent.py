"""
Test and configure RAG consent mechanism in Firestore.
This script demonstrates how to enable/disable external AI alerts.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase (use same credentials as main app)
cred_path = os.path.join(os.path.dirname(__file__), "..", "stancesense_qwerty_serviceAccountKey.json")
cred = credentials.Certificate(cred_path)

try:
    firebase_admin.initialize_app(cred)
except ValueError:
    # Already initialized
    pass

db = firestore.client()

def set_user_consent(uid: str, consent: bool):
    """
    Set RAG consent flag for a user in Firestore.
    
    Args:
        uid: User ID
        consent: True to enable external AI alerts, False to disable
    """
    doc_ref = db.collection("users").document(uid).collection("preferences").document("consent")
    doc_ref.set({
        "consent": consent,
        "updated_at": firestore.SERVER_TIMESTAMP
    })
    print(f"✅ Set consent for user '{uid}' to: {consent}")

def get_user_consent(uid: str) -> bool:
    """
    Get RAG consent flag for a user from Firestore.
    
    Args:
        uid: User ID
    
    Returns:
        bool: True if consented, False otherwise
    """
    doc_ref = db.collection("users").document(uid).collection("preferences").document("consent")
    doc = doc_ref.get()
    
    if doc.exists:
        consent = doc.to_dict().get("consent", False)
        print(f"📋 Current consent for user '{uid}': {consent}")
        return consent
    else:
        print(f"⚠️  No consent document found for user '{uid}' (defaults to False)")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("RAG CONSENT CONFIGURATION")
    print("=" * 80)
    print()
    
    # Test user (simulator mode)
    test_uid = "simulator_user_test_123"
    
    print(f"Testing consent mechanism for user: {test_uid}")
    print()
    
    # Get current consent status
    current_consent = get_user_consent(test_uid)
    print()
    
    # Prompt to change consent
    print("OPTIONS:")
    print("  1. Enable external AI alerts (Gemini API)")
    print("  2. Disable external AI alerts (knowledge base only)")
    print("  3. Check current status")
    print()
    
    choice = input("Enter choice (1/2/3): ").strip()
    print()
    
    if choice == "1":
        set_user_consent(test_uid, True)
        print()
        print("✅ ENABLED: Critical events will generate rich alerts using Gemini API")
        print("   Example: Falls will trigger natural language alerts with context")
    elif choice == "2":
        set_user_consent(test_uid, False)
        print()
        print("⚠️  DISABLED: Critical events will use knowledge base fallback only")
        print("   Example: Falls will show basic alert text without AI enhancement")
    elif choice == "3":
        print(f"Current status: {'ENABLED' if current_consent else 'DISABLED'}")
    else:
        print("Invalid choice")
    
    print()
    print("=" * 80)
