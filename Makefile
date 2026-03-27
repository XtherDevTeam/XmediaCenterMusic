create_avd:
	avdmanager create avd -n XMCM_AVD -k "system-images;android-36;google_apis;arm64-v8a" --device "pixel_6"

start_avd:
	emulator -avd XMCM_AVD