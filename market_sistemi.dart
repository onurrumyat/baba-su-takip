import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

// ==========================================
// 1. ANA İLAN LİSTESİ EKRANI (Tüm ilanların aktığı yer)
// ==========================================
class MarketScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kampüs Pazarı')),
      body: StreamBuilder(
        stream: FirebaseFirestore.instance.collection('ilanlar').orderBy('olusturmaTarihi', descending: true).snapshots(),
        builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('Henüz hiç ilan yok.'));
          }

          return ListView.builder(
            itemCount: snapshot.data!.docs.length,
            itemBuilder: (context, index) {
              var doc = snapshot.data!.docs[index];
              var data = doc.data() as Map<String, dynamic>;
              List photos = data['fotograflar'] ?? [];

              return Card(
                margin: const EdgeInsets.all(8.0),
                child: ListTile(
                  leading: photos.isNotEmpty
                      ? Image.network(photos[0], width: 50, height: 50, fit: BoxFit.cover)
                      : const Icon(Icons.image, size: 50),
                  title: Text(data['baslik'] ?? 'Başlıksız'),
                  subtitle: Text('${data['fiyat']} ₺'),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => ListingDetailScreen(listingData: data, listingId: doc.id)),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (context) => AddListingScreen()));
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

// ==========================================
// 2. İLAN EKLEME VE FOTOĞRAF YÜKLEME EKRANI
// ==========================================
class AddListingScreen extends StatefulWidget {
  @override
  _AddListingScreenState createState() => _AddListingScreenState();
}

class _AddListingScreenState extends State<AddListingScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  
  List<File> _selectedImages = [];
  bool _isLoading = false;
  final ImagePicker _picker = ImagePicker();

  void _showImageSourceActionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: <Widget>[
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Galeriden Yükle'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
                  if (pickedFile != null) {
                    setState(() { _selectedImages.add(File(pickedFile.path)); });
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('Kamera ile Çek'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final pickedFile = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
                  if (pickedFile != null) {
                    setState(() { _selectedImages.add(File(pickedFile.path)); });
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _uploadAndSaveListing() async {
    if (_titleController.text.isEmpty || _priceController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lütfen başlık ve fiyat girin.')));
      return;
    }

    setState(() { _isLoading = true; });

    try {
      List<String> uploadedImageUrls = [];
      String currentUserId = FirebaseAuth.instance.currentUser?.uid ?? 'bilinmeyen_kullanici';

      for (var imageFile in _selectedImages) {
        String fileName = DateTime.now().millisecondsSinceEpoch.toString() + '.jpg';
        Reference ref = FirebaseStorage.instance.ref().child('ilan_fotograflari').child(currentUserId).child(fileName);
        UploadTask uploadTask = ref.putFile(imageFile);
        TaskSnapshot snapshot = await uploadTask;
        String downloadUrl = await snapshot.ref.getDownloadURL();
        uploadedImageUrls.add(downloadUrl);
      }

      await FirebaseFirestore.instance.collection('ilanlar').add({
        'kullaniciId': currentUserId,
        'baslik': _titleController.text.trim(),
        'aciklama': _descController.text.trim(),
        'fiyat': double.tryParse(_priceController.text.trim()) ?? 0.0,
        'fotograflar': uploadedImageUrls,
        'olusturmaTarihi': FieldValue.serverTimestamp(),
      });

      setState(() { _isLoading = false; });
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('İlan başarıyla yayınlandı!')));

    } catch (e) {
      setState(() { _isLoading = false; });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata oluştu: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Yeni İlan Oluştur')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator()) 
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => _showImageSourceActionSheet(context),
                        child: Container(
                          width: 100, height: 100,
                          color: Colors.grey[300],
                          child: const Icon(Icons.add_a_photo, size: 40, color: Colors.grey),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ..._selectedImages.map((image) => Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: Stack(
                          children: [
                            Image.file(image, width: 100, height: 100, fit: BoxFit.cover),
                            Positioned(
                              right: 0, top: 0,
                              child: GestureDetector(
                                onTap: () => setState(() => _selectedImages.remove(image)),
                                child: Container(
                                  color: Colors.black54,
                                  child: const Icon(Icons.close, color: Colors.white, size: 20),
                                ),
                              ),
                            )
                          ],
                        ),
                      )).toList(),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                TextField(controller: _titleController, decoration: const InputDecoration(labelText: 'İlan Başlığı')),
                const SizedBox(height: 10),
                TextField(controller: _priceController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Fiyat (₺)')),
                const SizedBox(height: 10),
                TextField(controller: _descController, maxLines: 4, decoration: const InputDecoration(labelText: 'Açıklama')),
                const SizedBox(height: 30),
                ElevatedButton(onPressed: _uploadAndSaveListing, child: const Text('İlanı Yayınla'))
              ],
            ),
          ),
    );
  }
}

// ==========================================
// 3. İLAN DETAYI VE DÜZENLEME/SİLME EKRANI
// ==========================================
class ListingDetailScreen extends StatelessWidget {
  final Map<String, dynamic> listingData;
  final String listingId;

  ListingDetailScreen({required this.listingData, required this.listingId});

  Future<void> _deleteListing(BuildContext context) async {
    bool confirm = await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('İlanı Sil'),
        content: const Text('Bu ilanı silmek istediğinize emin misiniz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('İptal')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sil', style: TextStyle(color: Colors.red))),
        ],
      ),
    ) ?? false;

    if (confirm) {
      await FirebaseFirestore.instance.collection('ilanlar').doc(listingId).delete();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('İlan silindi.')));
      Navigator.pop(context);
    }
  }

  Future<void> _editListing(BuildContext context) async {
    TextEditingController priceController = TextEditingController(text: listingData['fiyat'].toString());
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Fiyatı Güncelle'),
        content: TextField(
          controller: priceController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Yeni Fiyat'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('İptal')),
          TextButton(
            onPressed: () async {
              await FirebaseFirestore.instance.collection('ilanlar').doc(listingId).update({
                'fiyat': double.tryParse(priceController.text) ?? listingData['fiyat'],
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('İlan güncellendi!')));
            }, 
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    String currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';
    bool isOwner = currentUserId == listingData['kullaniciId'];
    List<dynamic> photos = listingData['fotograflar'] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(listingData['baslik'] ?? 'İlan Detayı'),
        actions: [
          if (isOwner)
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'edit') _editListing(context);
                if (value == 'delete') _deleteListing(context);
              },
              itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                const PopupMenuItem<String>(value: 'edit', child: ListTile(leading: Icon(Icons.edit), title: Text('Düzenle'))),
                const PopupMenuItem<String>(value: 'delete', child: ListTile(leading: Icon(Icons.delete, color: Colors.red), title: Text('Sil', style: TextStyle(color: Colors.red)))),
              ],
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (photos.isNotEmpty)
              Container(
                height: 300,
                child: PageView.builder(
                  itemCount: photos.length,
                  itemBuilder: (context, index) {
                    return Image.network(photos[index], fit: BoxFit.cover);
                  },
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(listingData['baslik'] ?? '', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Text('${listingData['fiyat']} ₺', style: const TextStyle(fontSize: 22, color: Colors.green)),
                  const SizedBox(height: 20),
                  const Text('Açıklama:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 5),
                  Text(listingData['aciklama'] ?? '', style: const TextStyle(fontSize: 16)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
