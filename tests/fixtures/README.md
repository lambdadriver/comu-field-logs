# Test fixture

`tcard-sample.json` is a synthetic T-card backup written so `tests/tcard_t1.py` and `tests/test_v418_security.py` can run. It is not the original `sample.json` from the private test tree, and it is not an incident record.

The labels it uses (an exercise name, operator name, and cache identifiers) are the labels those tests already assert. They are sample data for the test, not a log from an incident.
