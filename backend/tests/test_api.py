import os
import uuid

os.environ.setdefault('DATABASE_URL', 'sqlite:///./backend_test.db')

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_valid_transaction_flow():
    user_id = str(uuid.uuid4())[:8]
    response = client.post('/generate-keys', json={'user_id': user_id, 'password': 'secret123'})
    assert response.status_code == 201

    response = client.post(
        '/sign-transaction',
        json={
            'sender': user_id,
            'password': 'secret123',
            'receiver': 'bob',
            'amount': 12.5,
            'currency': 'USD',
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload['payload']['sender'] == user_id

    verify = client.post(
        '/verify-transaction',
        json={
            'payload': payload['payload'],
            'signature': payload['signature'],
            'hash': payload['hash'],
            'jwt': payload['jwt'],
        },
    )
    assert verify.status_code == 200
    assert verify.json()['valid'] is True


def test_tampered_transaction_is_rejected():
    user_id = str(uuid.uuid4())[:8]
    response = client.post('/generate-keys', json={'user_id': user_id, 'password': 'secret123'})
    assert response.status_code == 201

    response = client.post(
        '/sign-transaction',
        json={
            'sender': user_id,
            'password': 'secret123',
            'receiver': 'bob',
            'amount': 25.0,
            'currency': 'USD',
        },
    )
    assert response.status_code == 200
    signed = response.json()
    tampered_payload = dict(signed['payload'])
    tampered_payload['amount'] = 99.99

    verify = client.post(
        '/verify-transaction',
        json={
            'payload': tampered_payload,
            'signature': signed['signature'],
            'hash': signed['hash'],
            'jwt': signed['jwt'],
        },
    )
    assert verify.status_code == 200
    assert verify.json()['valid'] is False
    assert 'hash mismatch' in verify.json()['reason'].lower() or 'payload' in verify.json()['reason'].lower()


def test_replay_attack_is_blocked():
    user_id = str(uuid.uuid4())[:8]
    response = client.post('/generate-keys', json={'user_id': user_id, 'password': 'secret123'})
    assert response.status_code == 201

    response = client.post(
        '/sign-transaction',
        json={
            'sender': user_id,
            'password': 'secret123',
            'receiver': 'bob',
            'amount': 50.0,
            'currency': 'USD',
        },
    )
    assert response.status_code == 200
    signed = response.json()

    first = client.post(
        '/verify-transaction',
        json={
            'payload': signed['payload'],
            'signature': signed['signature'],
            'hash': signed['hash'],
            'jwt': signed['jwt'],
        },
    )
    assert first.status_code == 200
    assert first.json()['valid'] is True

    second = client.post(
        '/verify-transaction',
        json={
            'payload': signed['payload'],
            'signature': signed['signature'],
            'hash': signed['hash'],
            'jwt': signed['jwt'],
        },
    )
    assert second.status_code == 200
    assert second.json()['valid'] is False
    assert 'nonce already used' in second.json()['reason'].lower()