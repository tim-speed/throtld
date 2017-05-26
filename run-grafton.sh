#!/bin/bash
grafton test --product=throtld --plan=free --region=unknown \
    --client-id=21jtaatqj8y5t0kctb2ejr6jev5w8 \
    --client-secret=3yTKSiJ6f5V5Bq-kWF0hmdrEUep3m3HKPTcPX7CdBZw \
    --connector-port=3001 \
    --new-plan=paid \
    http://localhost:1337/manifold
