import requests
import base64
from datetime import datetime
import json

class MPesaAPI:
    def __init__(self, consumer_key, consumer_secret, shortcode, passkey, callback_url, api_url):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.shortcode = shortcode
        self.passkey = passkey
        self.callback_url = callback_url
        self.api_url = api_url
        self.access_token = None
    
    def get_access_token(self):
        try:
            api_url = f"{self.api_url}/oauth/v1/generate?grant_type=client_credentials"
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_auth}'
            }
            
            response = requests.get(api_url, headers=headers)
            if response.status_code == 200:
                self.access_token = response.json().get('access_token')
                return self.access_token
            return None
        except Exception as e:
            print(f"Error getting access token: {e}")
            return None
    
    def generate_password(self):
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.shortcode}{self.passkey}{timestamp}"
        encoded_password = base64.b64encode(password_string.encode()).decode()
        return encoded_password, timestamp
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        if not self.access_token:
            self.get_access_token()
        
        if not self.access_token:
            return {'success': False, 'message': 'Failed to get access token'}
        
        password, timestamp = self.generate_password()
        
        if not phone_number.startswith('254'):
            phone_number = '254' + phone_number.lstrip('0')
        
        api_url = f"{self.api_url}/mpesa/stkpush/v1/processrequest"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone_number,
            'PartyB': self.shortcode,
            'PhoneNumber': phone_number,
            'CallBackURL': self.callback_url,
            'AccountReference': account_reference,
            'TransactionDesc': transaction_desc
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            return response.json()
        except Exception as e:
            return {'success': False, 'message': str(e)}
    
    def query_transaction(self, checkout_request_id):
        if not self.access_token:
            self.get_access_token()
        
        password, timestamp = self.generate_password()
        
        api_url = f"{self.api_url}/mpesa/stkpushquery/v1/query"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            return response.json()
        except Exception as e:
            return {'success': False, 'message': str(e)}
